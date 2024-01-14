
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';

// Application specific imports.
import { BazarService } from 'src/app/services/bazar.service';
import { ConfigService } from 'src/app/services/config.service';
import { GeneralService } from 'src/app/services/general.service';
import { MagicResponse } from 'src/app/models/magic-response.model';
import { environment } from 'src/environments/environment';

class Message {
  content: string;
  type: string;
  finish: string;
}

/**
 * Chatbot component for help.
 */
@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit {

  @Output() chatbotClosed = new EventEmitter<any>();
  @ViewChild('queryField') private queryField: any;

  messages: Message[] = [
    {
      content: 'Ask me anything about Magic Cloud or Hyperlambda',
      type: 'machine',
      finish: 'stop',
    },
  ];
  query: string = '';
  session: string;
  hubConnection: HubConnection;

  constructor(
    private service: BazarService,
    private cdr: ChangeDetectorRef,
    private configService: ConfigService,
    private generalService: GeneralService,
    private recaptchaV3Service: ReCaptchaV3Service) { }

  ngOnInit() {

    this.generalService.showLoading();
    this.configService.getGibberish(25,25).subscribe({

      next: (result: MagicResponse) => {

        this.session = result.result;
        let builder = new HubConnectionBuilder();
        this.hubConnection = builder.withUrl(environment.bazarUrl + '/sockets', {
          skipNegotiation: true,
          transport: HttpTransportType.WebSockets,
        }).build();
        this.hubConnection.on(this.session, (args) => {

          args = JSON.parse(args);

          if (args.message) {
            this.messages[this.messages.length - 1].content += args.message;
          }

          if (args.finish_reason) {
            this.messages[this.messages.length - 1].finish = args.finish_reason;
          }

          if (args.finished) {
            this.generalService.hideLoading();
            this.query = '';
          }

          this.cdr.detectChanges();
        });
        this.hubConnection.start().then(() => {

          this.generalService.hideLoading();

        }).catch(() => {

          this.generalService.hideLoading();
          this.generalService.showFeedback('Could not connect to socket', 'errorMessage');
        });
      },

      error: () => {

        this.generalService.hideLoading();
        this.generalService.showFeedback('Could not create session', 'errorMessage');
      }
    });
  }

  focus() {

    setTimeout(() => this.queryField.nativeElement.focus(), 500);
  }

  close() {

    this.chatbotClosed.emit();
  }

  submit() {

    this.messages.push({
      content: this.query,
      type: 'user',
      finish: 'stop',
    });
    this.cdr.detectChanges();

    this.generalService.showLoading();
    this.recaptchaV3Service.execute('aiAutoPrompt').subscribe({

      next: (token: string) => {

        this.messages.push({
          content: '',
          type: 'machine',
          finish: 'stop',
        });
        this.cdr.detectChanges();
        setTimeout(() => {
          const wrp = document.getElementById('chatMessages');
          const el = wrp.children[wrp.children.length - 1];
          el.scrollIntoView({behavior: 'smooth', block: 'start'});
        }, 1);
    
        this.service.chat(this.query, token, this.session).subscribe({

          error: () => {

            this.generalService.hideLoading();
            this.generalService.showFeedback('Could not get answer from service', 'errorMessage');
          }
        });
      },

      error: () => {

        this.generalService.hideLoading();
        this.generalService.showFeedback('Could not resolve reCAPTCHA', 'errorMessage');
      }
    });
  }

  getDots() {
    return `<span class="ainiro-dot ainiro-dot-1"></span>
<span class="ainiro-dot ainiro-dot-2"></span>
<span class="ainiro-dot ainiro-dot-3"></span>`;
  }
}
