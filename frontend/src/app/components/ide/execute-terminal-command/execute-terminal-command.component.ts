
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';

// Application specific imports.
import { Response } from '../../../models/response.model';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { ConfigService } from '../../config/services/config.service';

/*
 * Terminal command wrapper.
 */
class TerminalCommand {

  /*
   * Optional title to use for dialog
   */
  title?: string;

  /*
   * Actual command to transmit to server.
   */
  command: string;

  /*
   * Folder from where to execute command.
   */
  folder: string;
}

/**
 * Modal dialog to execute a terminal command, and waiting for it to finish,
 * before allowing user to close dialog.
 */
@Component({
  selector: 'app-execute-terminal-command',
  templateUrl: './execute-terminal-command.component.html',
  styleUrls: ['./execute-terminal-command.component.scss']
})
export class ExecuteTerminalCommandComponent implements OnInit, OnDestroy {

  // SignalR hub connection
  private hubConnection: HubConnection;

  // Channel to communicate with server over.
  private channel: string;

  /**
   * If true, the process is done executing.
   */
  public done = false;

  // Wrapper div for terminal.
  @ViewChild('terminal', {static: true}) terminal: ElementRef;

  /**
   * Creates an instance of your component.
   * 
   * @param configService Needed to create unique channel
   * @param backendService Needed to retrieve backend URL for connecting correctly to SigalR hub.
   * @param feedbackService Needed to display feedback to user
   * @param data Injected data
   */
  constructor(
    private configService: ConfigService,
    private backendService: BackendService,
    private feedbackService: FeedbackService,
    private dialogRef: MatDialogRef<ExecuteTerminalCommandComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TerminalCommand) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    /*
     * Showing user what we're about to do on server.
     */
    this.terminal.nativeElement.innerHTML += 'cd ' + this.data.folder + '<br>';
    this.terminal.nativeElement.innerHTML += this.data.command + '<br>';

    /*
     * Retrieving gibberish from server which is used as unique channel name,
     * to avoid multiple users/windows interfering with each others sessions.
     */
    this.configService.getGibberish(15, 25).subscribe((result: Response) => {

      // Storing gibberish to use as unique channel name.
      this.channel = result.result;

      // Creating our hub connection now that we know the channel name.
      let builder = new HubConnectionBuilder();
      this.hubConnection = builder.withUrl(this.backendService.current.url + '/sockets', {
          accessTokenFactory: () => this.backendService.current.token,
          skipNegotiation: true,
          transport: HttpTransportType.WebSockets,
        }).build();

      /*
       * Subscribing to [ide.terminal] messages which are transmitted by
       * the backend once some terminal output is ready.
       */
      this.hubConnection.on('ide.terminal.out.' + this.channel, (args) => {

        // Writing result to XTerm instance.
        const json = JSON.parse(args);

        // Checking if server gave us the 'null' value, which implies terminal should be closed.
        if (!json.result || json.result === '--waiting-for-input--') {

          // Closing terminal, session was closed by server.
          this.feedbackService.showInfo('Process is done executing');
          this.done = true;

        } else {

          // Appending text to output buffer.
          this.terminal.nativeElement.innerHTML += json.result + '<br>';
          this.terminal.nativeElement.scrollIntoView({ behavior: "smooth", block: "end" });
       }
      });

      // Connecting to SignalR
      this.hubConnection.start().then(() => {

        // When connected over socket we need to spawn a terminal on the server.
        this.hubConnection.invoke('execute', '/system/terminal/start', JSON.stringify({
          channel: this.channel,
          folder: this.data.folder,
        }))
        .then(() => {

          // Invoking backend.
          this.hubConnection.invoke('execute', '/system/terminal/command', JSON.stringify({
            cmd: this.data.command,
            channel: this.channel,
          })).catch(() => {

            // Oops, error!
            this.feedbackService.showError('Could not execute command on server');
          });
        })
        .catch(() => this.feedbackService.showError('Could not start terminal on server'));

      }, () => this.feedbackService.showError('Could not negotiate socket connection with backend'));
    });
  }

  /**
   * Implementation of OnDestroy.
   */
   public ngOnDestroy() {

    // Closing SignalR connection, making sure we stop terminal on server first.
    this.hubConnection.invoke('execute', '/system/terminal/stop', JSON.stringify({
      channel: this.channel,
    })).then(() => {

      // Closing SignalR socket connection.
      this.hubConnection.stop();
    });
  }

  /**
   * Invoked when user wants to close dialog.
   */
  public close() {

    // Closing dialog.
    this.dialogRef.close();
  }
}
