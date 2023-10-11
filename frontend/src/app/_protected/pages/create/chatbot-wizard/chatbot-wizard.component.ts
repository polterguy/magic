
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { BackendService } from 'src/app/_general/services/backend.service';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIModel, OpenAIService } from 'src/app/_general/services/openai.service';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import { MagicResponse } from 'src/app/_general/models/magic-response.model';
import { MachineLearningEmbedUiComponent } from '../../manage/machine-learning/components/machine-learning-embed-ui/machine-learning-embed-ui.component';
import { MatDialog } from '@angular/material/dialog';
import { OpenAIConfigurationDialogComponent } from 'src/app/_general/components/openai/openai-configuration-dialog/openai-configuration-dialog.component';
import { RecaptchaDialogComponent } from '../../misc/configuration/components/recaptcha-dialog/recaptcha-dialog.component';
import { ConfigService } from 'src/app/_general/services/config.service';

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

  sqlIte: boolean = false;
  hubConnection: HubConnection = null;
  isLoading: boolean = true;
  configured: boolean = false;
  hasApiKey: boolean = false;
  apiKey: string = null;
  hasReCaptcha: boolean = false;
  reCaptcha: any = null;
  isSaving: boolean = false;
  url: string = '';
  max: number = 25;
  autocrawl: boolean = false;
  vectorize: boolean = true;
  crawling: boolean = false;
  messages: any[] = [];
  doneCreatingBot: boolean = false;
  model: string = '';
  chat_model: OpenAIModel = null;
  chat_models: OpenAIModel[] = [];
  flavors: any[] = [
    {
      name: 'Sales Executive',
      prefix: `You are Frank, a sales executive for the company in the context. Follow these rules when replying to my questions:

* You will answer all my questions with information found in the context
* At every opportunity you have, you will recommend relevant products from the context
* Keep your answers short and concise
* Display relevant images and hyperlinks as Markdown
* Use emojis where it makes sense
* If you cannot find the answer to the question in the context, answer "I am sorry, but I don't know the answer. Could you provide some context or relevant keywords for me?"
* Always address the user by his or her name if you know it`
    },
    {
      name: 'The CEO',
      prefix: `You are Jane, the CEO for the company in the context. Follow these rules when replying to my questions:

* You are an expert on the subject of the conversation
* You will answer all my questions with information found in the context
* Keep your answers formal
* Display relevant images and hyperlinks as Markdown
* If you cannot find the answer to the question in the context, answer "I am sorry, but I don't understand"
* Always address the user by his or her name if you know it`
    },
    {
      name: 'One liner',
      prefix: `You are Peter, you are shy but highly intelligent. Follow these rules when replying to my questions:

* You are an expert on the subject of the conversation
* You will answer all my questions with information found in the context
* Keep your answers formal
* Answer all questions with a single sentence if possible, unless I explicitly ask for more information
* If you cannot find the answer to the question in the context, answer "I am sorry, but I don't understand"
* Always address the user by his or her name if you know it`
    },
    {
      name: 'Multilingual',
      prefix: `You are Ann, and you know every language that exists. Follow these rules when replying to my questions:

* You are an expert on the subject of the conversation
* You will answer all my questions with information found in the context
* Answer all questions in the same language as the question was asked in
* Display relevant images and hyperlinks as Markdown
* If you cannot find the answer to the question in the context, answer "I am sorry, but I don't understand"
* Always address the user by his or her name if you know it`
    },
    {
      name: 'Poet',
      prefix: `You are Harry, a poet. Follow these rules when replying to my questions:

* You will answer all my questions with information found in the context
* Answer all questions with poetic answers with beautiful and highly visual analogies
* If you cannot find the answer to the question in the context, answer "I am sorry, but I don't understand"`
    },
  ];
  flavor: any = null;

  constructor(
    private dialog: MatDialog,
    private configService: ConfigService,
    private openAIService: OpenAIService,
    private backendService: BackendService,
    private generalService: GeneralService) { }

  ngOnInit() {

    this.generalService.showLoading();
    this.configService.getDatabases().subscribe({

      next: (result: any) => {

        this.sqlIte = result.default === 'sqlite';

        this.openAIService.key().subscribe({
          next: (apiKey: any) => {
    
            this.hasApiKey = apiKey.result?.length > 0;
    
            this.apiKey = apiKey.result;
    
            this.backendService.getReCaptchaKeySecret().subscribe({
              next: (reCaptcha: any) => {
                this.hasReCaptcha = reCaptcha.key?.length > 0 && reCaptcha.secret?.length > 0;
                this.configured = this.hasApiKey && this.hasReCaptcha;
                this.reCaptcha = reCaptcha;
                this.flavor = this.flavors[0];
    
                if (!this.hasApiKey) {
    
                  this.manageOpenAI();
    
                } else if (!this.hasReCaptcha) {
    
                  this.manageCAPTCHA();
    
                } else {
    
                  this.getModels();
                }
              },
              error: () => {
    
                this.generalService.hideLoading();
                this.isLoading = false;
                this.generalService.showFeedback('Something went wrong as we tried to check if OpenAI API key is configured', 'errorMessage');
              }
            });
          },
          error: () => {
    
            this.generalService.hideLoading();
            this.generalService.showFeedback('Something went wrong as we tried to check if OpenAI API key is configured', 'errorMessage');
            this.isLoading = false;
          }
        });
      },

      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }

  getModels() {

    this.openAIService.models(this.apiKey).subscribe({
      next: (models: OpenAIModel[]) => {

        this.chat_models = models;
        this.chat_models = this.chat_models.filter((idx: OpenAIModel) => idx.id.startsWith('gpt'));
        let defModel = this.chat_models.filter(x => x.id === 'gpt-4');

        if (defModel.length > 0) {

          this.chat_model = defModel[0];
        } else {

          this.chat_model = this.chat_models.filter(x => x.id === 'gpt-3.5-turbo')[0];
        }

        this.generalService.hideLoading();
        this.isLoading = false;
      },
      error: () => {

        this.generalService.hideLoading();
        this.isLoading = false;

        this.generalService.showFeedback(
          'Something went wrong as we tried to retrieve your models',
          'errorMessage',
          'Ok',
          5000);
      }
    });
  }

  ngOnDestroy() {

    this.hubConnection?.stop();
  }

  goodWebsite() {

    const good = this.url.length > 0;
    if (!good) {
      return false;
    }
    return true;
  }

  createBot() {

    this.configService.getGibberish(10, 20).subscribe({
      next: (result: any) => {

        this.createBotImplementation(result.result);
      },
      error: (error: any) => {

        this.generalService.showFeedback(error?.error?.message ?? 'Something went wrong as we tried to create your bot', 'errorMessage', 'Ok', 10000);
      }
    });
  }

  createBotImplementation(feedbackChannel: string) {

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

    this.hubConnection.on(feedbackChannel, (args) => {

      args = JSON.parse(args);
      this.messages.push(args);
      this.doneCreatingBot = args.type === 'success' || args.type === 'error';

      if (args.type === 'success') {

        this.generalService.showFeedback('Done creating bot', 'successMessage');
        this.embed();

      } else if (args.type === 'warning') {

        this.generalService.showFeedback(args.message);

      } else if (args.type === 'error') {

        this.generalService.showFeedback(args.message, 'errorMessage');
        if (args.message.includes('license') && this.vectorize === true) {

          /*
           * Too many snippets according to license, still we'll vectorise the model explicitly to make sure
           * user gets at least a somewhat working chatbot to embed on page.
           */
          this.openAIService.vectorise(this.model).subscribe({
            next: () => {

              console.log('Vectorising started');
            },
            error: (error: any) => {

              this.generalService.showFeedback(error?.error?.message ?? 'Something went wrong as we tried to create your bot', 'errorMessage', 'Ok', 10000);
            }
          });
        }
      }
      setTimeout(() => {

        const domEl = document.getElementById('m_' + (this.messages.length - 1));
        domEl.scrollIntoView()
      }, 50);
    });

    this.hubConnection.start().then(() => {

      this.openAIService.createBot(
        this.url,
        this.chat_model.id,
        this.flavor?.prefix ?? '',
        this.max,
        this.autocrawl,
        feedbackChannel,
        this.vectorize).subscribe({
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
        maxWidth: '850px',
        data: {
          type: this.model,
          landing_page: true,
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

          } else {

            this.getModels();
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

          this.generalService.showLoading();
          this.isLoading = true;
          this.backendService.setReCaptchaKeySecret(result.key, result.secret).subscribe({
            next: () => {

              this.generalService.hideLoading();
              this.isLoading = false;
              this.generalService.showFeedback('reCAPTCHA settings successfully save', 'successMessage');
              this.hasReCaptcha = true;
              this.configured = this.hasApiKey;

              if (!this.hasApiKey) {

                this.manageOpenAI();

              } else {

                this.getModels();
              }
            },
            error: () => {

              this.generalService.hideLoading();
              this.isLoading = false;
              this.generalService.showFeedback('Something went wrong as we tried to check if OpenAI API key is configured', 'errorMessage');
              this.isLoading = false;
            }
          });
        }
      });
  }
}
