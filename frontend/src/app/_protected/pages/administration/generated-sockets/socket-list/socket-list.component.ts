import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Message } from 'src/app/_protected/models/common/message.model';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { SocketUser } from '../../generated-endpoints/_models/socket-user.model';
import { MessageWrapper, PublishDialogComponent } from '../components/publish-dialog/publish-dialog.component';
import { PublishedMessages } from '../_models/socket';
import { SocketService } from '../_services/socket.service';

@Component({
  selector: 'app-socket-list',
  templateUrl: './socket-list.component.html',
  styleUrls: ['./socket-list.component.scss']
})
export class SocketListComponent implements OnInit {

  @Input() publishedMessages: PublishedMessages[] = [];
  @Input() users: SocketUser[] = [];

  @Output() getConnections: EventEmitter<any> = new EventEmitter<any>();
  @Output() subscribe: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private dialog: MatDialog,
    private socketService: SocketService,
    public backendService: BackendService,
    private generalService: GeneralService) { }

  ngOnInit(): void {
  }

  public subscribeToPublishedMessage(itemName: string) {
    this.subscribe.emit(itemName);
  }

  /**
   * Invoked when user wants to generically post a message, to for instance
   * one or more groups, or one or more roles, instead of a single connection.
   */
  public publish(item: any) {
    this.dialog.open(PublishDialogComponent, {
      width: '550px',
      panelClass: 'light',
      data: {
        message: {
          name: item.name,
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
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')});
      }
    });
  }

  /**
   * Deletes a single message from list of messages.
   *
   * @param msg Message to delete
   */
   deleteMessage(msg: Message) {
    // this.messages.splice(this.messages.indexOf(msg), 1);
    // this.feedbackService.showInfoShort('Message was removed');
  }

  /**
   * Invoked when a socket subscription should be removed.
   *
   * @param subscription What subscription to remove
   */
  removeSubscription(subscription: string) {
    // this.hubConnection.off(subscription);
    // this.subscriptions.splice(this.subscriptions.indexOf(subscription), 1);
    // if (this.subscriptions.length === 0) {
    //   this.hubConnection.stop();
    //   this.hubConnection = null;
    //   this.getConnections();
    //   this.messages = [];
    // }
  }

  /**
   * Clears messages.
   */
  clearMessages() {
    // this.messages = [];
  }
}
