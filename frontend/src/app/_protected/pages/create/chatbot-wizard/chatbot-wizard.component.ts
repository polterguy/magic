
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { BackendService } from 'src/app/_general/services/backend.service';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import { MagicResponse } from 'src/app/_general/models/magic-response.model';
import { MachineLearningEmbedUiComponent } from '../../manage/machine-learning/components/machine-learning-embed-ui/machine-learning-embed-ui.component';
import { MatDialog } from '@angular/material/dialog';
import { OpenAIConfigurationDialogComponent } from 'src/app/_general/components/openai/openai-configuration-dialog/openai-configuration-dialog.component';
import { RecaptchaDialogComponent } from '../../misc/configuration/components/recaptcha-dialog/recaptcha-dialog.component';

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
  configured: boolean = false;
  hasApiKey: boolean = false;
  hasReCaptcha: boolean = false;
  reCaptcha: any = null;
  isSaving: boolean = false;
  url: string = '';
  crawling: boolean = false;
  messages: any[] = [];
  doneCreatingBot: boolean = false;
  model: string = '';
  flavors: any[] = [
    {name: 'Sales Executive', prefix: 'Answer the following as if you are a Sales Executive in the subject: '},
    {name: 'The CEO', prefix: 'Answer the following as if you are the CEO of the company: '},
    {name: 'Empathy', prefix: 'Answer the following as if you really care about the person: '},
    {name: 'Funny', prefix: 'Answer the following and finish with a relevant joke about the subject: '},
    {name: 'An Expert', prefix: 'Answer the following as if you are an expert in the subject: '},
    {name: 'One liner', prefix: 'Answer the following with one sentence: '},
    {name: 'Two liner', prefix: 'Answer the following with two sentences: '},
    {name: 'Multilingual', prefix: 'Answer the following question in the same language: '},
    {name: 'Wall of text', prefix: 'Answer the following with 5 paragraphs: '},
    {name: 'Poet', prefix: 'Answer the following with a poem: '},
    {name: 'Donald Trump', prefix: 'Answer the following in the style of Donald Trump: '},
    {name: 'Joe Biden', prefix: 'Answer the following in the style of Joe Biden: '},
    {name: 'Barack Obama', prefix: 'Answer the following in the style of Barack Obama: '},
    {name: 'Thomas Jefferson', prefix: 'Answer the following in the style of Thomas Jefferson: '},
    {name: 'Snoop Dog', prefix: 'Answer the following in the style of Snoop Dog: '},
    {name: 'Bob Marley', prefix: 'Answer the following in the style of Bob Marley: '},
    {name: 'Buddha', prefix: 'Answer the following in the style of the Buddha: '},
    {name: 'Jesus', prefix: 'Answer the following in the style of Jesus: '},
    {name: 'Pirate', prefix: 'Answer the following in the style of a Pirate: '},
    {name: 'Alien from Zorg', prefix: 'Answer the following as if you are an alien from the planet Zorg who came here to conquer the Earth: '},
    {name: 'Reddit Troll', prefix: 'Answer the following as if you are a Reddit troll: '},
  ];
  flavor: any = null;

  constructor(
    private dialog: MatDialog,
    private openAIService: OpenAIService,
    private backendService: BackendService,
    private generalService: GeneralService) { }

  ngOnInit() {

    this.generalService.showLoading();
    this.openAIService.key().subscribe({
      next: (apiKey: any) => {

        this.hasApiKey = apiKey.result?.length > 0;

        this.backendService.getReCaptchaKeySecret().subscribe({
          next: (reCaptcha: any) => {

            this.generalService.hideLoading();
            this.isLoading = false;
            this.hasReCaptcha = reCaptcha.key?.length > 0 && reCaptcha.secret?.length > 0;
            this.configured = this.hasApiKey && this.hasReCaptcha;
            this.reCaptcha = reCaptcha;

            if (!this.hasApiKey) {

              this.manageOpenAI();

            } else if (!this.hasReCaptcha) {

              this.manageCAPTCHA();

            }
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
        this.embed();

      } else if (args.type === 'warning') {

        this.generalService.showFeedback(args.message);

      } else if (args.type === 'error') {

        this.generalService.showFeedback('Something went wrong when creating your bot', 'errorMessage');
        this.embed();
      }
      setTimeout(() => {

        const domEl = document.getElementById('m_' + (this.messages.length - 1));
        domEl.scrollIntoView()
      }, 50);
    });

    this.hubConnection.start().then(() => {

      this.openAIService.createBot(this.url, this.flavor?.prefix ?? '').subscribe({
        next: (result: MagicResponse) => {
  
          this.model = result.result;
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

  embed() {

    this.dialog
      .open(MachineLearningEmbedUiComponent, {
        width: '80vw',
        maxWidth: '650px',
        data: {
          type: this.model,
          noClose: true,
          model: 'gpt-3.5-turbo',
        }
      });
  }

  closeBotCreator() {

    this.crawling = false;
  }

  /*
   * Private helper methods.
   */

  private manageOpenAI() {

    this.dialog
      .open(OpenAIConfigurationDialogComponent, {
        width: '80vw',
        maxWidth: '550px',
        disableClose: true,
      })
      .afterClosed()
      .subscribe((result: any) => {

        if (result.configured) {

          this.hasApiKey = true;
          this.configured = this.hasReCaptcha;

          if (!this.hasReCaptcha) {
            this.manageCAPTCHA();
          }
        }
      });
  }

  private manageCAPTCHA() {

    this.dialog
      .open(RecaptchaDialogComponent, {
        width: '80vw',
        maxWidth: '550px',
        data: this.reCaptcha,
        disableClose: true,
      })
      .afterClosed()
      .subscribe((result: any) => {

        if (result) {

          this.backendService.setReCaptchaKeySecret(result.key, result.secret).subscribe({
            next: () => {

              this.generalService.hideLoading();
              this.generalService.showFeedback('reCAPTCHA settings successfully save', 'successMessage');
              this.hasReCaptcha = true;
              this.configured = this.hasApiKey;

              if (!this.hasApiKey) {
                this.manageOpenAI();
              }
            },
            error: () => {

              this.generalService.hideLoading();
              this.generalService.showFeedback('Something went wrong as we tried to check if OpenAI API key is configured', 'errorMessage');
              this.isLoading = false;
            }
          });
        }
      });
  }
}
