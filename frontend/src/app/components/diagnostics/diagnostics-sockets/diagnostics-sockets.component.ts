
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Component, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { Message } from 'src/app/models/message.model';
import { ConnectComponent } from './connect/connect.component';
import { FeedbackService } from 'src/app/services/feedback.service';
import { SocketUser } from '../../endpoints/models/socket-user.model';
import { EndpointService } from '../../endpoints/services/endpoint.service';
import { SendMessageComponent } from './send-message/send-message.component';

/**
 * Sockets diagnostic component, allowing to see current connections grouped by users.
 */
@Component({
  selector: 'app-diagnostics-sockets',
  templateUrl: './diagnostics-sockets.component.html',
  styleUrls: ['./diagnostics-sockets.component.scss']
})
export class DiagnosticsSocketsComponent implements OnInit {

  /**
   * Users connected to a socket according to filtering condition,
   * as returned from our backend.
   */
  public users: SocketUser[] = [];

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
   * Creates an instance of your component.
   * 
   * @param dialog Needed to create modal dialogues
   * @param feedbackService Needed to provide feedback to user
   * @param endpointService Used to retrieve list of all connected users from backend
   */
  constructor(
    private dialog: MatDialog,
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
   * Shows a modal dialog allowing you to send a message to one single connection.
   * 
   * @param connection Which connection to transmit message to
   */
  public connectionSelected(connection: string) {

    // Creating modal dialogue that asks user what message and payload to transmit to server.
    const dialogRef = this.dialog.open(SendMessageComponent, {
      width: '550px',
      data: {
        name: '',
        content: '{\r\n  "foo": "bar"\r\n}'
      }
    });

    // Subscribing to after closed to allow for current component to actually do the invocation towards backend.
    dialogRef.afterClosed().subscribe((data: Message) => {

      // Checking if modal dialog wants transmit message.
      if (data) {

        // Invoking backend to transmit message to client.
        this.endpointService.sendSocketMessage(data, connection).subscribe(() => {

          // Providing feedback to user.
          this.feedbackService.showInfoShort('Message was successfully sent');

        }, (error: any) => this.feedbackService.showError(error));
      }
    });
  }

  /**
   * Invoked when user wants to establish a new socket connection.
   */
  public subscribe() {

    // Creating modal dialogue that asks user what message he wants to subscribe to.
    const dialogRef = this.dialog.open(ConnectComponent, {
      width: '550px',
      data: ''
    });

    // Subscribing to after closed to allow for current component to actually create the subscription.
    dialogRef.afterClosed().subscribe((message: string) => {

      // Checking if modal dialog wants transmit message.
      if (message) {

        // Invoking backend to transmit message to client.
        console.log(message)
      }
    });
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
