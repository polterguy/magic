
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { BackendService } from 'src/app/_general/services/backend.service';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';

/**
 * Helper wizard component to create a chatbot rapidly, guiding the user through all
 * required steps.
 */
@Component({
  selector: 'app-chatbot-wizard',
  templateUrl: './chatbot-wizard.component.html',
  styleUrls: ['./chatbot-wizard.component.scss']
})
export class ChatbotWizardComponent implements OnInit, OnDestroy {

  hubConnection: HubConnection = null;
  isLoading: boolean = true;
  apiKey: string = '';
  siteKey: string = '';
  secret: string = '';
  configured: boolean = false;
  isSaving: boolean = false;
  url: string = '';
  crawling: boolean = false;
  messages: any[] = [];
  doneCreatingBot: boolean = false;

  constructor(
    private openAIService: OpenAIService,
    private backendService: BackendService,
    private generalService: GeneralService) { }

  ngOnInit() {

    this.generalService.showLoading();
    this.openAIService.key().subscribe({
      next: (result: any) => {

        this.apiKey = result.result;

        this.backendService.getReCaptchaKeySecret().subscribe({
          next: (result: any) => {

            this.siteKey = result.key;
            this.secret = result.secret;
            this.generalService.hideLoading();
            this.isLoading = false;
            this.configured = this.apiKey?.length > 0 && this.siteKey?.length > 0 && this.secret?.length > 0;
          },
          error: () => {

            this.generalService.hideLoading();
            this.generalService.showFeedback('Something went wrong as we tried to check if OpenAI API key is configured', 'errorMessage');
            this.isLoading = false;
          }
        });
        this.generalService.hideLoading();
        this.isLoading = false;
      },
      error: () => {

        this.generalService.hideLoading();
        this.generalService.showFeedback('Something went wrong as we tried to check if OpenAI API key is configured', 'errorMessage');
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy() {

    this.hubConnection?.stop();
  }

  configurationGood() {

    return this.apiKey?.length > 0 && this.siteKey?.length > 0 && this.secret?.length > 0;
  }

  goodWebsite() {

    const good = this.url.length > 0 && (this.url.startsWith('http://') || this.url.startsWith('https://'));
    if (!good) {
      return false;
    }
    const splits = this.url.split('://');
    if (splits.length === 0 || splits[1].length < 5 || splits[1].indexOf('.') === -1 || splits[1].indexOf('/') !== -1) {
      return false;
    }
    return true;
  }

  saveConfiguration() {

    this.isSaving = true;
    this.generalService.showLoading();
    this.openAIService.setKey(this.apiKey).subscribe({
      next: () => {

        this.backendService.setReCaptchaKeySecret(this.siteKey, this.secret).subscribe({
          next: () => {

            this.generalService.hideLoading();
            this.generalService.showFeedback('API key and reCAPTCHA settings successfully applied', 'successMessage');
            this.isSaving = false;
            this.configured = true;
          },
          error: () => {

            this.generalService.hideLoading();
            this.generalService.showFeedback('Something went wrong as we tried to check if OpenAI API key is configured', 'errorMessage');
            this.isSaving = false;
          }
        });
      },
      error: () => {

        this.generalService.hideLoading();
        this.generalService.showFeedback('Something went wrong as we tried to check if OpenAI API key is configured', 'errorMessage');
        this.isSaving = false;
      }
    });
  }

  createBot() {

    this.crawling = true;
    this.generalService.showLoading();
    this.doneCreatingBot = false;
    this.messages = [];

    let builder = new HubConnectionBuilder();
    this.hubConnection = builder.withUrl(this.backendService.active.url + '/sockets', {
      accessTokenFactory: () => this.backendService.active.token.token,
      skipNegotiation: true,
      transport: HttpTransportType.WebSockets,
    }).build();

    this.hubConnection.on('magic.backend.chatbot', (args) => {

      args = JSON.parse(args);
      this.messages.push(args);
      this.doneCreatingBot = args.type === 'success' || args.type === 'error';

      if (args.type === 'success') {

        this.generalService.showFeedback('Done creating bot', 'successMessage');

      } else if (args.type === 'error') {

        this.generalService.showFeedback('Something went wrong when creating your bot', 'errorMessage');
      }
      setTimeout(() => {
        const domEl = document.getElementById('m_' + (this.messages.length - 1));
        domEl.scrollIntoView()
      }, 50);
    });

    this.hubConnection.start().then(() => {

      this.openAIService.createBot(this.url).subscribe({
        next: () => {
  
          this.generalService.hideLoading();
        },
        error: () => {
  
          this.generalService.hideLoading();
          this.generalService.showFeedback('Something went wrong as we tried to create your bot', 'errorMessage');
          this.doneCreatingBot = true;
          this.hubConnection.stop();
          this.hubConnection = null;
        }
      });
    });
  }

  closeBotCreator() {

    this.crawling = false;
  }
}
