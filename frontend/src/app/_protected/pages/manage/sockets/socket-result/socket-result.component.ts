
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Message } from 'src/app/_protected/models/common/message.model';
import { BackendService } from 'src/app/_general/services/backend.service';
import { SocketUser } from '../../endpoints/_models/socket-user.model';
import { MessageWrapper, PublishDialogComponent } from '../components/publish-dialog/publish-dialog.component';
import { SocketService } from '../_services/socket.service';

/**
 * Helper component for displaying results from a message pushed by the backend to the client.
 */
@Component({
  selector: 'app-socket-result',
  templateUrl: './socket-result.component.html'
})
export class SocketResultComponent {

  @Input() users: SocketUser[] = [];
  @Input() messages: any = [];
  @Input() subscriptions: SocketUser[] = [];

  @Output() removeSubscription: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private dialog: MatDialog,
    private socketService: SocketService,
    public backendService: BackendService,
    private generalService: GeneralService) { }

  /**
   * Shows a modal dialog allowing you to send a message to one single connection.
   *
   * @param connection Which connection to transmit message to
   */
  sendMessageToConnection(connection: string) {

    // Creating modal dialogue that asks user what message and payload to transmit to server.
    const dialogRef = this.dialog.open(PublishDialogComponent, {
      width: '550px',
      panelClass: 'light',
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
          next: () => this.generalService.showFeedback('Message was successfully sent', 'successMessage'),
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
        });
      }
    });
  }

  public removeSelectedSubscription(item: string) {
    this.removeSubscription.emit(item);
  }

  /**
   * Deletes a single message from list of messages.
   *
   * @param msg Message to delete
   */
  public deleteMessage(msg: Message) {
    this.messages.splice(this.messages.indexOf(msg), 1);
    this.generalService.showFeedback('Message was removed', 'successMessage');
  }
}
