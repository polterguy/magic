
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { MatDialog } from '@angular/material/dialog';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';

// Application specific imports.
import { ConfigService } from 'src/app/services/config.service';
import { BackendService } from 'src/app/services/backend.service';
import { GeneralService } from 'src/app/services/general.service';
import { MagicResponse } from 'src/app/models/magic-response.model';
import { OpenAIModel, OpenAIService } from 'src/app/services/openai.service';
import { RecaptchaDialogComponent } from 'src/app/components/protected/misc/configuration/components/recaptcha-dialog/recaptcha-dialog.component';
import { OpenAIConfigurationDialogComponent } from 'src/app/components/protected/common/openai/openai-configuration-dialog/openai-configuration-dialog.component';
import { MachineLearningEmbedUiComponent } from 'src/app/components/protected/manage/machine-learning/components/machine-learning-embed-ui/machine-learning-embed-ui.component';

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
  auto_destruct: boolean = true;
  crawling: boolean = false;
  messages: any[] = [];
  doneCreatingBot: boolean = false;
  model: string = '';
  chat_model: OpenAIModel = null;
  chat_models: OpenAIModel[] = [];
  finished: boolean = false;
  flavors: any[] = [];
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

            if (!this.hasApiKey) {
    
              this.manageOpenAI();

            } else {

              this.apiKey = apiKey.result;
              this.configured = this.hasApiKey;
              this.getModels();
            }
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
        this.chat_models = this.chat_models.filter(el => el.chat === true);
        let defModel = this.chat_models.filter(x => x.id === 'gpt-4o');

        if (defModel.length > 0) {

          this.chat_model = defModel[0];

        } else {

          this.chat_model = this.chat_models.filter(x => x.id === 'gpt-3.5-turbo')[0];
        }

        this.openAIService.getSystemMessage().subscribe({

          next: (result: any[]) => {

            result = result.sort((lhs: any, rhs: any) => {
              if (lhs.name.includes('DYNAMIC')) {
                return -1;
              }
              else if (rhs.name.includes('DYNAMIC')) {
                return 1;
              }
              return 0;
            });
            this.flavors = result;
            this.flavor = this.flavors.filter(x => x.name.includes('Frank') && x.name.includes('DYNAMIC'))[0];
            this.generalService.hideLoading();
            this.isLoading = false;
          },

          error: () => {

            this.isLoading = false;
            this.generalService.showFeedback('Something went wrong as we tried to retrieve questionnaires', 'errorMessage');
            this.generalService.hideLoading();
          }
        });
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

  embed() {

    this.dialog
      .open(MachineLearningEmbedUiComponent, {
        width: '80vw',
        maxWidth: '750px',
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
    this.finished = false;
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
        disableClose: false,
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
              this.generalService.showFeedback('reCAPTCHA settings successfully saved', 'successMessage');
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
        } else {

          this.configured = true;
          this.getModels();
        }
      });
  }

  private createBotImplementation(feedbackChannel: string) {

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

      const messageWrapper = document.getElementById('messageWrapper');
      let shouldScroll= false;
      if(messageWrapper.scrollTop + 50 > (messageWrapper.scrollHeight - messageWrapper.offsetHeight)) {
        shouldScroll = true;
      }

      args = JSON.parse(args);
      this.messages.push(args);
      this.doneCreatingBot = args.type === 'success' || args.type === 'error';

      if (args.type === 'success') {

        this.generalService.showFeedback('Done creating bot', 'successMessage');
        this.embed();
        this.finished = true;

      } else if (args.type === 'error') {

        this.generalService.showFeedback(args.message, 'errorMessage');
        this.hubConnection.stop();
        this.hubConnection = null;
        this.finished = true;
      }

      if(shouldScroll) {
        setTimeout(() => {

        const domEl = document.getElementById('m_' + (this.messages.length - 1));
          domEl.scrollIntoView();
        }, 50);
      }
    });

    this.hubConnection.start().then(() => {

      this.openAIService.createBot(
        this.url,
        this.chat_model.id,
        this.flavor?.prefix ?? '',
        this.max,
        this.autocrawl,
        this.auto_destruct,
        feedbackChannel,
        this.vectorize,
        this.flavor?.instruction).subscribe({

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
}
