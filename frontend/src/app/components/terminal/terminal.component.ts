
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Terminal } from 'xterm';
import { HttpTransportType, HubConnection, HubConnectionBuilder} from '@aspnet/signalr';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';

// Application specific imports.
import { Response } from '../../models/response.model';
import { BackendService } from 'src/app/services/backend.service';
import { ConfigService } from '../config/services/config.service';
import { FeedbackService } from 'src/app/services/feedback.service';

/**
 * Terminal component for allowing user to use the terminal through a
 * web based interface.
 */
@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-terminal',
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.scss']
})
export class TerminalComponent implements OnInit, OnDestroy {

  // Unique channel name for SignalR communication to communicate with backend terminal instance.
  private channel = '';

  // Actual XTerm instance.
  private term: Terminal;

  // SignalR hub connection
  private hubConnection: HubConnection;

  // Buffer for text currently typed into terminal.
  private buffer: string = '';

  // False if no output has been sent to server.
  private sentCommand = false;

  /**
   * If true, we are connected to backend process.
   */
  public isConnected = false;

  // Wrapper div for terminal.
  @ViewChild('terminal', {static: true}) terminal: ElementRef;

  /**
   * Creates an instance of your component.
   * 
   * @param configService Needed to retrieve 'gibberish' creating a unique channel for the user on SignalR
   * @param backendService Needed to retrieve the root URL for backend used by SignalR.
   * @param feedbackService Needed to display feedback to caller.
   */
  public constructor(
    private configService: ConfigService,
    private backendService: BackendService,
    private feedbackService: FeedbackService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Creating our XTerm component.
    this.term = new Terminal();
    this.term.open(this.terminal.nativeElement);

    // Accepting input.
    this.term.write('$ ');
    this.term.focus();

    // Subscribing to key events.
    this.term.onData(e => {

      // Making sure we are connected before doing anything else.
      if (!this.isConnected) {
        return;
      }

      // Handling characters correctly.
      switch (e) {

        // Carriage return.
        case '\r\n':
        case '\n':
        case '\r':

          // Checking if we have something to actually transmit to terminal on backend.
          if (this.buffer.length > 0) {

            // Checking if user wants to clear terminal.
            if (this.buffer === 'clear' || this.buffer === 'cls') {
              this.buffer = '';
              this.term.writeln('');
              this.term.clear();
              this.term.write('$ ');
              return;
            }

            // We have something to transmit to server.
            this.term.writeln('');
            this.sentCommand = true;

            // Invoking backend.
            this.hubConnection.invoke('execute', '/system/ide/terminal-command', JSON.stringify({
              cmd: this.buffer,
              channel: this.channel,
            })).catch(() => {

              // Oops, error!
              this.feedbackService.showError('Could not execute command on server');
              this.term.write('$ ');
            });

            // Emptying buffer.
            this.buffer = '';

          } else {

            // Empty line, just adding come 'formating'.
            this.term.writeln('');
            this.term.write('$ ');
          }
          break;

        // Swallowing cursor keys and other keys we don't know how to handle.
        case '[A':
        case '[B':
        case '[C':
        case '[D':
        case '\t':
          break;

        // Backspace/Delete key
        case '\u007F':

          // Do not delete the prompt
          if (this.buffer.length > 0) {
            this.term.write('\b \b');
            this.buffer = this.buffer.substring(0, this.buffer.length - 1);
          }
          break;

        // Default, simply adding character to buffer.
        default:

          // Default action is to simply append the character into XTerm.
          this.buffer += e;
          this.term.write(e);
          break;
      }
    });

    // Connecting to SignalR socket.
    this.connectToTerminal();
  }

  /**
   * Implementation of OnDestroy.
   */
  public ngOnDestroy() {

    // Closing SignalR connection, making sure we stop terminal on server first.
    this.hubConnection.invoke('execute', '/system/ide/terminal-stop', JSON.stringify({
      channel: this.channel,
    })).then(() => {

      // Closing SignalR socket connection.
      this.hubConnection.stop();
      this.term.dispose();
    });
  }

  /*
   * Private helper methods.
   */

  /*
   * Connects to SignalR socket.
   */
  private connectToTerminal() {

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
        if (!json.result) {

          // Closing terminal, session was closed by server.
          this.term.writeln('Terminal session was closed by server');
          this.isConnected = false;
          this.feedbackService.showInfo('Refresh browser window to reconnect to terminal process');
          return;
        }

        // Checking what type of content server provided us with.
        if (json.error === true) {

          // Oops, error in process on server for some reasons.
          this.term.writeln(json.result);

        } else if (json.result.endsWith('echo --waiting-for-input--')) {

          // Do nothing, next result will echo the command resulting in prompt being shown.

        } else if (json.result === '--waiting-for-input--') {

          // Making sure we display prompt to user.
          this.term.write('$ ');

        } else {

          // Checking if this is initial garbage information from Windows or not.
          if (this.sentCommand === false) {

            // This is just operating system information, avoiding outputting it, to avoid messing up prompt.
            return;
          }

          // Default implementation, simply writing out result from server.
          this.term.writeln(json.result);
        }
      });

      // Connecting to SignalR
      this.hubConnection.start().then(() => {

        // When connected over socket we need to spawn a terminal on the server.
        this.hubConnection.invoke('execute', '/system/ide/terminal-start', JSON.stringify({
          channel: this.channel,
          folder: '/',
        }))
        .then(() => {
          this.isConnected = true;
        })
        .catch(() => this.feedbackService.showError('Could not start terminal on server'));

      }, () => this.feedbackService.showError('Could not negotiate socket connection with backend'));
    });
  }
}
