
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { Message } from 'src/app/models/message.model';
import { SocketService } from '../services/socket.service';
import { BackendService } from 'src/app/services/backend.service';
import { SocketUser } from '../../../_protected/pages/generated-endpoints/_models/socket-user.model';
import { FeedbackService } from 'src/app/services/feedback.service';
import { SubscribeComponent } from './subscribe/subscribe.component';
import { MessageWrapper, PublishComponent } from './publish/publish.component';

/**
 * Sockets diagnostic component, allowing to see current connections grouped by users.
 */
@Component({
  selector: 'app-sockets',
  templateUrl: './sockets.component.html',
  styleUrls: ['./sockets.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('0.75s cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})
export class SocketsComponent implements OnInit, OnDestroy {

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
   * Filter form control for filtering connections to display according to users.
   */
  filterFormControl: FormControl;

  /**
   * What users are currently being edited and viewed.
   */
  selectedUsers: string[] = [];

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatPaginator, {static: true}) public paginator: MatPaginator;

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
   * @param feedbackService Needed to provide feedback to user
   */
  constructor(
    private dialog: MatDialog,
    private socketService: SocketService,
    public backendService: BackendService,
    private feedbackService: FeedbackService) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.paginator.pageIndex = 0;
        this.getConnections();
    });

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

  /**
   * Invoked when user wants to clear filter condition.
   */
  clearFilter() {
    this.filterFormControl.setValue('');
  }

  /**
   * Toggles the details view for a single user.
   *
   * @param user User to toggle details for
   */
  toggleDetails(user: SocketUser) {
    const idx = this.selectedUsers.indexOf(user.username);
    if (idx !== -1) {
      this.selectedUsers.splice(idx, 1);
    } else {
      this.selectedUsers.push(user.username);
    }
  }

  /**
   * Returns true if we should display the details view for specified user.
   *
   * @param user User to check if we should display details for
   */
  shouldDisplayDetails(user: SocketUser) {
    return this.selectedUsers.filter(x => x === user.username).length > 0;
  }

  /**
   * Invoked when paginator wants to page data table.
   *
   * @param e Page event argument
   */
  paged(e: PageEvent) {
    this.paginator.pageSize = e.pageSize;
    this.getConnections();
  }

  /**
   * Invoked when user wants to establish a new socket connection.
   */
  subscribe() {
    const dialogRef = this.dialog.open(SubscribeComponent, {
      width: '550px',
      data: ''
    });
    dialogRef.afterClosed().subscribe((message: string) => {
      if (message) {
        if (this.subscriptions.filter(x => x === message).length > 0) {
          this.feedbackService.showInfoShort('You are already subscribing to such messages');
          return;
        }
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
            setTimeout(() => this.getConnections(), 500);
          });
        }
      }
    });
  }

  /**
   * Shows a modal dialog allowing you to send a message to one single connection.
   *
   * @param connection Which connection to transmit message to
   */
  sendMessageToConnection(connection: string) {

    // Creating modal dialogue that asks user what message and payload to transmit to server.
    const dialogRef = this.dialog.open(PublishComponent, {
      width: '550px',
      data: {
        message: {
          name: '',
          content: '{\r\n  "foo": "bar"\r\n}',
        },
        client: connection,
        groups: '',
        roles: '',
      }
    });

    // Subscribing to after closed to allow for current component to actually do the invocation towards backend.
    dialogRef.afterClosed().subscribe((data: MessageWrapper) => {

      // Checking if modal dialog wants transmit message.
      if (data) {

        // Invoking backend to transmit message to client.
        this.socketService.publishMessage(data.message, data.client, data.roles, data.groups).subscribe({
          next: () => this.feedbackService.showInfoShort('Message was successfully sent'),
          error: (error: any) => this.feedbackService.showError(error)});
      }
    });
  }

  /**
   * Invoked when user wants to generically post a message, to for instance
   * one or more groups, or one or more roles, instead of a single connection.
   */
  post() {
    const dialogRef = this.dialog.open(PublishComponent, {
      width: '550px',
      data: {
        message: {
          name: '',
          content: '{\r\n  "foo": "bar"\r\n}',
        },
        client: '',
        groups: '',
        roles: '',
      }
    });
    dialogRef.afterClosed().subscribe((data: MessageWrapper) => {
      if (data) {
        this.socketService.publishMessage(data.message, data.client, data.roles, data.groups).subscribe({
          next: () => this.feedbackService.showInfoShort('Message was successfully sent'),
          error: (error: any) => this.feedbackService.showError(error)});
      }
    });
  }

  /**
   * Deletes a single message from list of messages.
   *
   * @param msg Message to delete
   */
  deleteMessage(msg: Message) {
    this.messages.splice(this.messages.indexOf(msg), 1);
    this.feedbackService.showInfoShort('Message was removed');
  }

  /**
   * Invoked when a socket subscription should be removed.
   *
   * @param subscription What subscription to remove
   */
  removeSubscription(subscription: string) {
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
  clearMessages() {
    this.messages = [];
  }

  /*
   * Private helper methods.
   */

  /*
   * Returns connections to caller by unvoking backend.
   */
  getConnections() {
    this.socketService.socketUsers(
      this.filterFormControl.value,
      this.paginator.pageIndex * this.paginator.pageSize,
      this.paginator.pageSize).subscribe({
        next: (users: SocketUser[]) => {
          this.selectedUsers = [];
          this.users = users ?? [];
          this.socketService.socketUserCount(this.filterFormControl.value).subscribe({
            next: (count: Count) => this.count = count.count,
            error: (error: any) => this.feedbackService.showError(error)});
        },
        error: (error: any) => this.feedbackService.showError(error)});
  }
}
