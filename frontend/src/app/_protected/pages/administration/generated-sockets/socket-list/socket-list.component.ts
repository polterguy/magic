import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Message } from 'src/app/_protected/models/common/message.model';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { SubscribeDialogComponent } from '../components/subscribe-dialog/subscribe-dialog.component';
import { SocketService } from '../_services/socket.service';

@Component({
  selector: 'app-socket-list',
  templateUrl: './socket-list.component.html',
  styleUrls: ['./socket-list.component.scss']
})
export class SocketListComponent implements OnInit, OnDestroy {

  @Output() getConnections: EventEmitter<any> = new EventEmitter<any>();

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

  constructor(
    private dialog: MatDialog,
    private socketService: SocketService,
    public backendService: BackendService,
    private generalService: GeneralService) { }

  ngOnInit(): void {
  }

  /**
   * Invoked when user wants to establish a new socket connection.
   */
  public subscribe() {
    const dialogRef = this.dialog.open(SubscribeDialogComponent, {
      width: '550px',
      data: this.subscriptions
    });
    dialogRef.afterClosed().subscribe((message: string) => {
      if (message) {
console.log(message)
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
            setTimeout(() => this.getConnections.emit(true), 500);
          });
        }
      }
    });
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
