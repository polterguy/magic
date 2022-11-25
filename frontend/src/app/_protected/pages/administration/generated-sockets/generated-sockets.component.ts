import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import { Observable } from 'rxjs';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Count } from 'src/app/_protected/models/common/count.model';
import { Message } from 'src/app/_protected/models/common/message.model';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { SocketUser } from '../generated-endpoints/_models/socket-user.model';
import { SubscribeDialogComponent } from './components/subscribe-dialog/subscribe-dialog.component';
import { PublishedMessages } from './_models/socket';
import { SocketService } from './_services/socket.service';

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
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
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
