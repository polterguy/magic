
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder
} from '@aspnet/signalr';
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';

// Application specific imports.
import { Response } from '../../../models/response.model';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { ConfigService } from '../../../services/config.service';

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

  // To make sure we try as hard aspossible to resize terminal once window resizes.
  private fitAddon: FitAddon;
  @HostListener('window:resize', ['$event'])
  private onWindowResize() { this.fitAddon.fit(); }

  /**
   * If true, we are connected to backend process.
   */
  isConnected = false;

  // Wrapper div for terminal.
  @ViewChild('terminal', {static: true}) terminal: ElementRef;

  /**
   * Creates an instance of your component.
   * 
   * @param configService Needed to retrieve 'gibberish' creating a unique channel for the user on SignalR
   * @param backendService Needed to retrieve the root URL for backend used by SignalR.
   * @param feedbackService Needed to display feedback to caller.
   */
  constructor(
    private configService: ConfigService,
    private backendService: BackendService,
    private feedbackService: FeedbackService) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.term = new Terminal();
    this.fitAddon = new FitAddon();
    this.term.loadAddon(this.fitAddon);
    this.term.open(this.terminal.nativeElement);
    this.fitAddon.fit();
    this.term.write('$ ');
    this.term.focus();
    this.term.onData(e => {
      if (!this.isConnected) {
        return;
      }
      switch (e) {
        case '\r\n':
        case '\n':
        case '\r':
          if (this.buffer.length > 0) {
            if (this.buffer === 'clear' || this.buffer === 'cls') {
              this.buffer = '';
              this.term.writeln('');
              this.term.clear();
              this.term.write('$ ');
              return;
            }
            this.term.writeln('');
            this.sentCommand = true;
            this.hubConnection.invoke('execute', '/system/terminal/command', JSON.stringify({
              cmd: this.buffer,
              channel: this.channel,
            })).catch(() => {
              this.feedbackService.showError('Could not execute command on server');
              this.term.write('$ ');
            });
            this.buffer = '';
          } else {
            this.term.writeln('');
            this.term.write('$ ');
          }
          break;
        case '[A':
        case '[B':
        case '[C':
        case '[D':
        case '\t':
          break;

        case '\u007F':
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
    this.connectToTerminal();
  }

  /**
   * Implementation of OnDestroy.
   */
  ngOnDestroy() {
    this.hubConnection.invoke('execute', '/system/terminal/stop', JSON.stringify({
      channel: this.channel,
    })).then(() => {
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
    this.configService.getGibberish(15, 25).subscribe({
      next: (result: Response) => {
        this.channel = result.result;
        let builder = new HubConnectionBuilder();
        this.hubConnection = builder.withUrl(this.backendService.active.url + '/sockets', {
            accessTokenFactory: () => this.backendService.active.token.token,
            skipNegotiation: true,
            transport: HttpTransportType.WebSockets,
          }).build();

        /*
        * Subscribing to [ide.terminal] messages which are transmitted by
        * the backend once some terminal output is ready.
        */
        this.hubConnection.on('ide.terminal.out.' + this.channel, (args) => {
          const json = JSON.parse(args);
          if (!json.result) {
            this.term.writeln('Terminal session was closed by server');
            this.isConnected = false;
            this.feedbackService.showInfo('Refresh browser window to reconnect to terminal process');
            return;
          }
          if (json.error === true) {
            this.term.writeln(json.result);
          } else if (json.result.endsWith('echo --waiting-for-input--')) {
            // Do nothing, next result will echo the command resulting in prompt being shown.
          } else if (json.result === '--waiting-for-input--') {
            this.term.write('$ ');
          } else {
            if (this.sentCommand === false) {
              return;
            }
            this.term.writeln(json.result);
          }
        });
        this.hubConnection.start().then(() => {
          this.hubConnection.invoke('execute', '/system/terminal/start', JSON.stringify({
            channel: this.channel,
            folder: '/',
          }))
          .then(() => {
            this.isConnected = true;
          })
          .catch(() => this.feedbackService.showError('Could not start terminal on server'));

        }, () => this.feedbackService.showError('Could not negotiate socket connection with backend'));
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }
}
