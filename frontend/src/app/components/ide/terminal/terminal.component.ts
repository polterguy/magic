
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Terminal } from 'xterm';
import { Subscription } from 'rxjs';
import { HubConnection, HubConnectionBuilder} from '@aspnet/signalr';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';

// Application specific imports.
import { Message } from 'src/app/models/message.model';
import { Response } from '../../../models/response.model';
import { MessageService } from 'src/app/services/message.service';
import { BackendService } from 'src/app/services/backend.service';
import { ConfigService } from '../../config/services/config.service';

/**
 * Terminal component for allowing user to use the terminal through a web based interface
 */
@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-terminal',
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.scss']
})
export class TerminalComponent implements OnInit, OnDestroy {

  // Unique channel name for SignalR communication.
  private channel = '';

  // Subscription for message service.
  private subscription: Subscription;

  // Actual XTerm instance.
  private term: Terminal;

  // SignalR hub connection
  private hubConnection: HubConnection;

  // Buffer for text currently typed into terminal.
  private buffer: string = '';

  /**
   * Current working folder for terminal script.
   */
  public currentFolder = '/';

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
    */
  public constructor(
    private configService: ConfigService,
    private messageService: MessageService,
    private backendService: BackendService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Making sure we subscribe to relevant messages.
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {

      // Checking if this is an interesting message.
      if (msg.name === 'terminal.current-folder.set') {

        // Creating our XTerm component.
        this.term = new Terminal();
        this.term.open(this.terminal.nativeElement);

        // Settings current working folder.
        this.currentFolder = <string>msg.content;
        this.term.writeln(this.currentFolder);

        // Accepting input.
        this.term.focus();

        // Subscribing to key events.
        this.term.onData(e => {

          // Handling characters correctly.
          switch (e) {

            // Carriage return.
            case '\r':

              // Invoking backend using SignalR.
              if (this.buffer.length > 0) {
                this.term.writeln('');
                this.hubConnection.invoke('execute', '/system/ide/bash-command', JSON.stringify({
                  cmd: this.buffer,
                  channel: this.channel,
                }));
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
              this.buffer += e;
              this.term.write(e);
              break;
          }
        });

        // Connecting to SignalR socket.
        this.connectToTerminal();
      }
    });
  }

  /**
   * Implementation of OnDestroy.
   */
   public ngOnDestroy() {

    // Unsubscribing to message subscription.
    this.subscription.unsubscribe();

    // Closing SignalR connection, making sure we stop terminal on server first.
    this.hubConnection.invoke('execute', '/system/ide/bash-stop', JSON.stringify({
      channel: this.channel,
    })).then(() => {

      // Closing SignalR socket connection.
      this.hubConnection.stop();
    });
  }

  /**
   * Invoked when terminal should be closed.
   */
  public closeTerminal() {

    // Transmitting message to inform subscribers of that terminal window should be closed.
    this.messageService.sendMessage({
      name: 'terminal.close'
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
     * to avoid multiple users interfering with each others sessions.
     */
    this.configService.getGibberish(15, 25).subscribe((result: Response) => {

      // Storing gibberish to use as unique channel name.
      this.channel = result.result;

      // Creating our hub connection now that we know the channel name.
      let builder = new HubConnectionBuilder();
      this.hubConnection = builder.withUrl(this.backendService.current.url + '/signalr', {
          accessTokenFactory: () => this.backendService.current.token
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
          this.closeTerminal();
          return;
        }
        if (json.error === true) {
          this.term.writeln(json.result);
        } else {
          this.term.writeln(json.result);
        }
      });

      // Connecting to SignalR
      this.hubConnection.start().then(() => {

        // When connected over socket we need to spawn a terminal on the server.
        this.hubConnection.invoke('execute', '/system/ide/bash-start', JSON.stringify({
          channel: this.channel,
          folder: this.currentFolder
        }));
      });
    });
  }
}
