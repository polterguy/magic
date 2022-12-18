
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Message } from 'src/app/_protected/models/common/message.model';
import { BackendService } from 'src/app/_general/services/backend.service';
import { SocketUser } from '../../endpoints/_models/socket-user.model';
import { MessageWrapper, PublishDialogComponent } from '../components/publish-dialog/publish-dialog.component';
import { PublishedMessage } from '../_models/published-message';
import { SocketService } from '../_services/socket.service';

/**
 * Helper component for displaying socket messages published by the backend.
 */
@Component({
  selector: 'app-socket-list',
  templateUrl: './socket-list.component.html'
})
export class SocketListComponent {

  @Input() publishedMessages: PublishedMessage[] = [];
  @Input() users: SocketUser[] = [];

  @Output() getConnections: EventEmitter<any> = new EventEmitter<any>();
  @Output() subscribe: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private dialog: MatDialog,
    private socketService: SocketService,
    public backendService: BackendService,
    private generalService: GeneralService) { }

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
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
        });
      }
    });
  }
}
