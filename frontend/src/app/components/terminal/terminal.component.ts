
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
import { FeedbackService } from 'src/app/services/feedback.service';
import { ConfigService } from '../config/services/config.service';

/**
 * Terminal component for allowing user to use the terminal through a web based interface
 */
@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-terminal',
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.scss']
})
export class TerminalComponent implements OnInit {

  // Unique channel name for SignalR communication.
  private channel = '';

  // Actual XTerm instance.
  private term: Terminal;

  // SignalR hub connection
  private hubConnection: HubConnection;

  // Buffer for text currently typed into terminal.
  private buffer: string = '';

  // Number of lines received since last input from server.
  private noReceived = 0;

  // False if no output has been sent to server.
  private sentCommand = false;

  /**
   * Wrapper div for terminal.
   */
  @ViewChild('terminal', {static: true}) terminal: ElementRef;

   /**
    * Creates an instance of your component.
    * 
    * @param configService Needed to retrieve 'gibberish' creating a unique channel for the user on SignalR
    * @param messageService Service used to publish messages to other components in the system
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

      // Handling characters correctly.
      switch (e) {

        // Carriage return.
        case '\r':

          // Invoking backend using SignalR.
          this.noReceived = 0;
          if (this.buffer.length > 0) {
            this.term.writeln('');
            this.sentCommand = true;

            // Invoking backend.
            this.hubConnection.invoke('execute', '/system/ide/terminal-command', JSON.stringify({
              cmd: this.buffer,
              channel: this.channel,
            })).catch((error: any) => {

              // Oops, error!
              this.feedbackService.showError('Could not execute command on server');
              this.term.write('$ ');
            });
          }

          // Emptying buffer.
          this.buffer = '';
          break;

        // Backspace/Delete key
        case '\u007F':

          // Do not delete the prompt
          if (this.buffer.length > 0) {
            this.term.write('\b \b');
            this.buffer = this.buffer.substring(0, this.buffer.length - 1);
          }
          break;

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

  /*
   * Private helper methods.
   */

  /*
   * Connects to SignalR socket.
   */
  private connectToTerminal() {

    /*
     * Retrieving gibberish from server which is used as unique channel name,
     * to avoid multiple users interfering with each others sessions.
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
        
        // Writing result to xterm instance.
        const json = JSON.parse(args);

        // Checking if server gave us the 'null' value, which implies terminal should be closed.
        if (!json.result) {

          // Closing terminal, session was closed by server.
          this.term.writeln('Terminal session was closed by server');
          return;
        }

        if (json.error === true) {
          if (++this.noReceived === 1) {
            this.term.writeln('');
          }
          this.term.writeln(json.result);
        } else if (json.result.endsWith('echo --waiting-for-input--')) {
          ; // Do nothing, next result will echo the command resulting in prompt being shown.
        } else if (json.result === '--waiting-for-input--') {
          if (this.noReceived > 0) {
            this.term.writeln('');
          }
          this.term.write('$ ');
        } else {
          if (this.sentCommand === false) {
            // This is just operating system information, avoiding outputing it, to avoid messing up prompt.
            return;
          }
          if (++this.noReceived === 1) {
            this.term.writeln('');
          }
          this.term.writeln(json.result);
        }
      });

      // Connecting to SignalR
      this.hubConnection.start().then(() => {

        // When connected over socket we need to spawn a terminal on the server.
        this.hubConnection.invoke('execute', '/system/ide/terminal-start', JSON.stringify({
          channel: this.channel,
          folder: '/',
        })).catch((error: any) => this.feedbackService.showError('Could not start terminal on server'));

      }, (error: any) => this.feedbackService.showError('Could not negotiate socket connection with backend'));
    });
  }
}
