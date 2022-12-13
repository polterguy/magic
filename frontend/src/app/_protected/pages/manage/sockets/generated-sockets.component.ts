
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Count } from 'src/app/_protected/models/common/count.model';
import { Message } from 'src/app/_protected/models/common/message.model';
import { BackendService } from 'src/app/_general/services/backend.service';
import { SocketUser } from '../endpoints/_models/socket-user.model';
import { SubscribeDialogComponent } from './components/subscribe-dialog/subscribe-dialog.component';
import { PublishedMessages } from './_models/socket';
import { SocketService } from './_services/socket.service';
import { MessageWrapper, PublishDialogComponent } from './components/publish-dialog/publish-dialog.component';

@Component({
  selector: 'app-generated-sockets',
  templateUrl: './generated-sockets.component.html',
  styleUrls: ['./generated-sockets.component.scss']
})
export class GeneratedSocketsComponent implements OnInit, OnDestroy {

  /**
   * Users connected to a socket according to filtering condition,
   * as returned from our backend.
   */
  users: SocketUser[] = [];

  /**
   * Currently expanded element.
   */
  expandedElement: SocketUser | null;

  /**
   * Number of socket connections matching specified filtering condition.
   */
  count: number;

  /**
   * What users are currently being edited and viewed.
   */
  selectedUsers: string[] = [];

  public publishedMessages: PublishedMessages[] = [];
  public CopyPublishedMessages: PublishedMessages[] = [];

  public searchKey: string = '';

  pageIndex: number = 0;
  pageSize: number = 100;
  totalItems: number = 0;

  /**
   * SignalR socket subscriptions (message names).
   */
  subscriptions: string[] = [];

  /**
   * Messages published over socket connection.
   */
  messages: Message[] = [];

  // SignalR hub connection
  private hubConnection: HubConnection = null;

  /**
  * Creates an instance of your component.
  *
  * @param dialog Needed to create modal dialogues
  * @param socketService Needed retrieve socket information and publish socket messages
  * @param backendService Needed to retrieve backend URL to connect to web sockets in backend
  * @param generalService Needed to provide feedback to user
  */
  constructor(
    private dialog: MatDialog,
    private socketService: SocketService,
    public backendService: BackendService,
    private generalService: GeneralService) { }

  ngOnInit(): void {
    this.getConnections();
    this.getCount();
    this.getMessages();
  }

  public filterList(event: any) {
    this.searchKey = event;
    if (event && event !== '') {
      this.publishedMessages = this.CopyPublishedMessages.filter((item: any) => item.name.indexOf(event) > -1);
    } else {
      this.publishedMessages = this.CopyPublishedMessages;
    }
  }

  /*
     * Returns connections to caller by unvoking backend.
     */
  public getConnections(getCount?: boolean) {
    this.socketService.socketUsers(
      this.searchKey,
      this.pageIndex * this.pageSize,
      this.pageSize).subscribe({
        next: (users: SocketUser[]) => {
          this.selectedUsers = [];
          this.users = users ?? [];
          if (getCount && this.users.length > 0) {
            this.getCount();
          } else if (getCount && this.users.length === 0) {
            this.totalItems = 0;
          }
        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
      });
  }

  private getCount() {
    this.socketService.socketUserCount(this.searchKey).subscribe({
      next: (count: Count) => this.count = count.count,
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  private getMessages() {
    this.socketService.socketMessages().subscribe({
      next: (res: PublishedMessages[]) => {
        this.publishedMessages = res || [];
        this.CopyPublishedMessages = res || [];
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  /**
   * Publishes a socket message.
   */
  public publish() {
    this.dialog.open(PublishDialogComponent, {
      width: '550px',
      panelClass: 'light',
      data: {
        message: {
          content: '{\r\n  "foo": "bar"\r\n}',
        },
        client: '',
        groups: '',
        roles: '',
      }
    }).afterClosed().subscribe((data: MessageWrapper) => {
      if (data) {
        this.socketService.publishMessage(data.message, data.client, data.roles, data.groups).subscribe({
          next: () => this.generalService.showFeedback('Message was successfully published', 'successMessage'),
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
        });
      }
    });
  }

  /**
   * Invoked when user wants to establish a new socket connection.
   */
  public subscribe(itemName?: string) {
    const dialogRef = this.dialog.open(SubscribeDialogComponent, {
      width: '550px',
      data: {
        subscriptionName: itemName,
        subscriptionList: this.subscriptions
      }
    });
    dialogRef.afterClosed().subscribe((message: string) => {
      if (message) {

        let createdNow = false;
        if (!this.hubConnection) {
          let builder = new HubConnectionBuilder();
          this.hubConnection = builder.withUrl(this.backendService.active.url + '/sockets', {
            accessTokenFactory: () => this.backendService.active.token.token,
            skipNegotiation: true,
            transport: HttpTransportType.WebSockets,
          }).build();
          createdNow = true;
        }
        this.hubConnection.on(message, (args) => {
          this.messages.push({
            name: message,
            content: JSON.parse(args),
          });
        });
        this.subscriptions.push(message);

        if (createdNow) {
          this.hubConnection.start().then(() => {

            /*
             * Since we now have one additional connection (obviously),
             * we need to re-retrieve connections.
             *
             * However, due to that SignalR doesn't immediately create the connection
             * for unknown reasons, we have to apply a "wait 500 milliseconds" type of
             * trickery here.
             */
            setTimeout(() => this.getConnections(true), 500);
          });
        }
      }
    });
  }

  /**
   * Invoked when a socket subscription should be removed.
   *
   * @param subscription What subscription to remove
   */
  public removeSubscription(subscription: string) {
    this.hubConnection.off(subscription);
    this.subscriptions.splice(this.subscriptions.indexOf(subscription), 1);
    if (this.subscriptions.length === 0) {
      this.hubConnection.stop();
      this.hubConnection = null;
      this.getConnections();
      this.messages = [];
    }
  }

  /**
   * Clears messages.
   */
  public clearMessages() {
    this.messages = [];
  }

  /**
   * Invoked when paginator wants to page data table.
   *
   * @param e Page event argument
   */
  public changePage(e: PageEvent) {
    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
    this.getConnections();
  }

  /**
   * Implementation of OnDestroy.
   */
  ngOnDestroy() {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }
}
