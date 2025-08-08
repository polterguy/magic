
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import { marked } from 'marked';
import hljs from 'highlight.js';
import mermaid from 'mermaid';
import { BackendService } from 'src/app/services/backend.service';
import { ConfigService } from 'src/app/services/config.service';
import { GeneralService } from 'src/app/services/general.service';
import { OpenAIService } from 'src/app/services/openai.service';

/**
 * Vibe coding component, allowing the user to instruct the system using natural language.
 */
@Component({
  selector: 'app-vibe-coding',
  templateUrl: './vibe-coding.component.html',
  styleUrls: ['./vibe-coding.component.scss']
})
export class VibeCodingComponent implements OnInit, OnDestroy {

  @ViewChild('outputDiv') private outputDiv!: ElementRef;
  @ViewChild('queryTextarea') queryTextarea!: ElementRef;

  private hubConnection: HubConnection = null;
  private session: string = null;
  public query: string = null;
  private response: string = null;
  private waitingString = '<p><span class="ainiro-dot ainiro-dot-1"></span><span class="ainiro-dot ainiro-dot-2"></span><span class="ainiro-dot ainiro-dot-3"></span></p>';
  messages: any[] = [];
  is_answering: boolean = false;
  frontendUrl: string = null;

  constructor(
    private openAIService: OpenAIService,
    private configService: ConfigService,
    private generalService: GeneralService,
    private backendService: BackendService) { }

  ngOnInit() {

    // Initialising frontend URL
    this.frontendUrl = this.backendService.active.url;

    // Applying plugin support for marked
    const renderer = {
      link: function (href: string, title: string, text: string) {
        if (text) {
          if (title) {
            return (
              '<a target="_blank" href="' +
              href +
              '" title="' +
              title +
              '">' +
              text +
              '</a>'
            );
          }
          return '<a target="_blank" href="' + href + '">' + text + '</a>';
        }
        return '<a target="_blank" href="' + href + '">' + href + '</a>';
      },

      image: function (href: string, title: string, text: string) {
        const titleAttr = title ? ` title="${title}"` : '';
        const altAttr = text ? ` alt="${text}"` : '';
        return `<img src="${href}"${titleAttr}${altAttr} onerror="this.style.display='none';" />`;
      },

      code: (code: string, language: string) => {
        if (language === 'mermaid') {
          return `<div class="mermaid">${code}</div>`;
        }
        return `<pre class="${language}"><code>${code}</code></pre>`;
      },
    };

    marked.use({
      renderer,
    });

    marked.setOptions({
      highlight: (code, lang) => {
        let validLanguage = 'plaintext';
        if (lang && lang.toLowerCase() !== 'hyperlambda' && hljs.getLanguage(lang)) {
          validLanguage = lang;
        }
        return hljs.highlight(code, { language: validLanguage }).value;
      },
    });
    mermaid.initialize({ startOnLoad: false });
  }

  ngOnDestroy() {

    this.hubConnection?.stop();
  }

  onKeydownEnter(event: any) {

    if (!event.shiftKey) {
      event.preventDefault();
      this.submit();
    }
  }

  submit() {

    // Making sure we've actually got a query.
    if (!this.query || this.query === '') {
      return;
    }

    // Making sure we don't allow for pushing multiple queries at the same time.
    this.is_answering = true;

    // Making sure we open socket channel if not already open.
    this.ensureSocket(() => {

      this.response = '';
      this.messages.push({
        type: 'human',
        message: this.query,
      });
      this.messages.push({
        type: 'machine',
        message: this.waitingString,
      });
      this.generalService.showLoading();
      this.openAIService.query(this.query, 'default', false, this.session, null, true).subscribe({

        next: (res: any) => {

          this.query = '';
          this.generalService.hideLoading();
          this.scrollToBottom();
        },

        error: (error: any) => {

          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
          this.generalService.hideLoading();
        }
      });
    });
  }

  startCreating() {

    this.query = 'What can you do?';
    this.submit();
  }

  getHelp(event) {
    (<any>window).ainiro_faq_question(event, 'What is Magic Cloud?');
  }

  /*
   * Private helper methods.
   */

  private ensureSocket(functor: () => void) {

    if (this.hubConnection) {
      functor();
      return;
    }

    // Making sure we create a unique channel for responses to be streamed back to client.
    this.generalService.showLoading();
    this.configService.getGibberish(20, 20).subscribe({

      next: (res: any) => {

        this.session = res.result;
        let builder = new HubConnectionBuilder();
        this.hubConnection = builder
          .withUrl(this.backendService.active.url + '/sockets', {
            accessTokenFactory: () => this.backendService.active.token.token,
            skipNegotiation: true,
            transport: HttpTransportType.WebSockets,
          })
          .build();

        // Subscribing to channel messages.
        this.hubConnection.on(this.session, (args) => {
          const obj = JSON.parse(args);
          this.handleSocketMessage(obj);
        });

        // Connecting to hub
        this.hubConnection
          .start()
          .then(() => {
            this.generalService.hideLoading();
            functor();
          })
          .catch((error) => {
            this.generalService.showFeedback(
              'Could not connect to socket. Check browser log for details.',
              'errorMessage'
            );
            this.generalService.hideLoading();
            console.log(error);
          });
      },

      error: (error: any) => {

        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  private handleSocketMessage(msg: any) {

    // Checking if we've got tokens streaming from server.
    if (msg.finished === true) {

      this.is_answering = false;
      setTimeout(() => {
        this.queryTextarea.nativeElement.focus();
        mermaid.init(undefined, document.querySelectorAll('.mermaid'));
      }, 1);
      this.applySyntaxHighlighting();

    } else if (msg.message) {

      // Making sure we remove the jumping dots
      if (this.messages[this.messages.length - 1].message.includes(this.waitingString)) {
        this.messages[this.messages.length - 1].message = this.messages[this.messages.length - 1].message.replace(this.waitingString, '');
      }

      this.response += msg.message;
      this.messages[this.messages.length - 1].message = marked.parse(this.response);
      this.scrollToBottom();

    } else if (msg.function_waiting) {

      this.response = this.response.trim();
      this.response +=
        '\n\n<span class="function_waiting">Waiting ...</span>\n\n';
      this.messages[this.messages.length - 1].message = marked.parse(this.response);
      return;

    } else if (msg.function_result) {

      let xtra = '';
      if (msg.file) {
        xtra = '<h3 class="no-margin">' + msg.file + '</h3>';
        if (msg.invocation) {
          xtra +=
            '<pre class="no-margin">' +
            JSON.stringify(JSON.parse(msg.invocation), null, 2) +
            '</pre>';
        }
        while (xtra.indexOf('"') !== -1) {
          xtra = xtra.replace('"', "'");
        }
        xtra = ' tabindex="0" data-tippy-content="' + xtra + '"';
      }
      this.response = this.response.trim();
      this.response = this.response.replace(
        '<span class="function_waiting">Waiting ...</span>',
        ''
      );
      this.response +=
        '\n\n<span class="function_succeeded"' +
        xtra +
        '>' +
        msg.function_result +
        '</span>\n\n';
      return;
    }
  }

  private scrollToBottom() {

    setTimeout(() => {
    const el = this.outputDiv?.nativeElement;
    if (el) {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: 'smooth'
        });
      }
    });
  }

  private applySyntaxHighlighting() {
    setTimeout(() => {
      document
        .querySelectorAll('pre code')
        .forEach((el) => {
          if (!el.classList.contains('hyperlambda') && !el.parentElement.classList.contains('hyperlambda')) {
            hljs.highlightElement(el as HTMLElement);
          }
        });
    }, 0);
  }
}
