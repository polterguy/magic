
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { Message } from 'src/app/models/message.model';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { SubscribeComponent } from './subscribe/subscribe.component';
import { SocketUser } from '../endpoints/models/socket-user.model';
import { EndpointService } from '../../../services/endpoint.service';
import { MessageWrapper, PublishComponent } from './publish/publish.component';
import { AuthService } from '../../../services/auth.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

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
  public users: SocketUser[] = [];
  public expandedElement: SocketUser | null;

  /**
   * Number of socket connections matching specified filtering condition.
   */
  public count: number;

  /**
   * Filter form control for filtering connections to display according to users.
   */
  public filterFormControl: FormControl;

  /**
   * What users are currently being edited and viewed.
   */
  public selectedUsers: string[] = [];

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatPaginator, {static: true}) public paginator: MatPaginator;

  /**
   * SignalR socket subscriptions (message names).
   */
  public subscriptions: string[] = [];

  /**
   * Messages published over socket connection.
   */
  public messages: Message[] = [];

  // SignalR hub connection
  private hubConnection: HubConnection = null;

  /**
   * Creates an instance of your component.
   * 
   * @param dialog Needed to create modal dialogues
   * @param authService Needed to verify user has access to component
   * @param backendService Needed to retrieve backend URL to connect to web sockets in backend
   * @param feedbackService Needed to provide feedback to user
   * @param endpointService Used to retrieve list of all connected users from backend
   */
  constructor(
    private dialog: MatDialog,
    public authService: AuthService,
    private backendService: BackendService,
    private feedbackService: FeedbackService,
    private endpointService: EndpointService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Creating our filtering control.
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {

        // Resetting paginator.
        this.paginator.pageIndex = 0;

        // Retrieving connections/users again since filtering condition has changed.
        this.getConnections();
    });

    // Retrieving all connected users from backend.
    this.getConnections();
  }

  /**
   * Implementation of OnDestroy.
   */
  public ngOnDestroy() {

    // Checking if we've got subscriptions to socket messages, and if so, making sure we clean up.
    if (this.hubConnection) {

      // House cleaning.
      this.hubConnection.stop();
    }
  }

  /**
   * Invoked when user wants to clear filter condition.
   */
  public clearFilter() {

    // Just resetting the control's value will trigger the debounce method.
    this.filterFormControl.setValue('');
  }

  /**
   * Toggles the details view for a single user.
   * 
   * @param user User to toggle details for
   */
  public toggleDetails(user: SocketUser) {

    // Checking if we're already displaying details for current item.
    const idx = this.selectedUsers.indexOf(user.username);
    if (idx !== -1) {

      // Hiding item.
      this.selectedUsers.splice(idx, 1);

    } else {

      // Displaying item.
      this.selectedUsers.push(user.username);
    }
  }

  /**
   * Returns true if we should display the details view for specified user.
   * 
   * @param user User to check if we should display details for
   */
  public shouldDisplayDetails(user: SocketUser) {

    // Returns true if we're currently displaying this particular item.
    return this.selectedUsers.filter(x => x === user.username).length > 0;
  }

  /**
   * Invoked when paginator wants to page data table.
   * 
   * @param e Page event argument
   */
  public paged(e: PageEvent) {

    // Changing pager's size according to arguments, and retrieving items from backend again.
    this.paginator.pageSize = e.pageSize;
    this.getConnections();
  }

  /**
   * Invoked when user wants to establish a new socket connection.
   */
  public subscribe() {

    // Creating modal dialogue that asks user what message he wants to subscribe to.
    const dialogRef = this.dialog.open(SubscribeComponent, {
      width: '550px',
      data: ''
    });

    // Subscribing to after closed to allow for current component to actually create the socket subscription.
    dialogRef.afterClosed().subscribe((message: string) => {

      // Checking if modal dialog wants to create a subscription.
      if (message) {

        // Verifying we're not already subscribing to this guy.
        if (this.subscriptions.filter(x => x === message).length > 0) {

          // We're already subscribing to this guy.
          this.feedbackService.showInfoShort('You are already subscribing to such messages');
          return;
        }

        // If this is our first socket subscription, we'll have to create our connection.
        let createdNow = false;
        if (!this.hubConnection) {

          // Creating our connection.
          let builder = new HubConnectionBuilder();
          this.hubConnection = builder.withUrl(this.backendService.current.url + '/sockets', {
              accessTokenFactory: () => this.backendService.current.token,
              skipNegotiation: true,
              transport: HttpTransportType.WebSockets,
          }).build();

          // Needed to make sure we start our socket connection further down.
          createdNow = true;
        }
    
        // Making sure we subscribe to messages published over socket.
        this.hubConnection.on(message, (args) => {

          // Updating model.
          this.messages.push({
            name: message,
            content: JSON.parse(args),
          });
        });

        // Adding subscription to model.
        this.subscriptions.push(message);

        if (createdNow) {

          // Starting connection.
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
  public sendMessageToConnection(connection: string) {

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
        this.endpointService.sendSocketMessage(data.message, data.client, data.roles, data.groups).subscribe(() => {

          // Providing feedback to user.
          this.feedbackService.showInfoShort('Message was successfully sent');

        }, (error: any) => this.feedbackService.showError(error));
      }
    });
  }

  /**
   * Invoked when user wants to generically post a message, to for instance
   * one or more groups, or one or more roles, instead of a single connection.
   */
  public post() {

    // Creating modal dialogue that asks user what message and payload to transmit to server.
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

    // Subscribing to after closed to allow for current component to actually do the invocation towards backend.
    dialogRef.afterClosed().subscribe((data: MessageWrapper) => {

      // Checking if modal dialog wants transmit message.
      if (data) {

        // Invoking backend to transmit message to client.
        this.endpointService.sendSocketMessage(data.message, data.client, data.roles, data.groups).subscribe(() => {

          // Providing feedback to user.
          this.feedbackService.showInfoShort('Message was successfully sent');

        }, (error: any) => this.feedbackService.showError(error));
      }
    });

  }

  /**
   * Deletes a single message from list of messages.
   * 
   * @param msg Message to delete
   */
  public deleteMessage(msg: Message) {

    // Removing message from list of messages.
    this.messages.splice(this.messages.indexOf(msg), 1);

    // Providing feedback to user.
    this.feedbackService.showInfoShort('Message was removed');
  }

  /**
   * Invoked when a socket subscription should be removed.
   * 
   * @param subscription What subscription to remove
   */
  public removeSubscription(subscription: string) {

    // Making sure we unsubscribe to messages of specified type.
    this.hubConnection.off(subscription);
    this.subscriptions.splice(this.subscriptions.indexOf(subscription), 1);

    // Checking if this is our last subscription, at which point we stop connection entirely.
    if (this.subscriptions.length === 0) {

      // This is our last subscription.
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

    // Resettings messages to empty array.
    this.messages = [];
  }

  /*
   * Private helper methods.
   */

  /*
   * Returns connections to caller by unvoking backend.
   */
  private getConnections() {

    // Invoking backend to retrieve connected users according to filtering and pagination condition(s).
    this.endpointService.socketUsers(
      this.filterFormControl.value,
      this.paginator.pageIndex * this.paginator.pageSize,
      this.paginator.pageSize).subscribe((users: SocketUser[]) => {

      // Making sure we reset view details items.
      this.selectedUsers = [];

      // Assigning result to model.
      this.users = users ?? [];

      // Retrieving number of socket connections matching filter condition.
      this.endpointService.socketUserCount(this.filterFormControl.value).subscribe((count: Count) => {

        // Assigning model.
        this.count = count.count;

      }, (error: any) => this.feedbackService.showError(error));

    }, (error: any) => this.feedbackService.showError(error));
  }
}
