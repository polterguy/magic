
/*
 * Copyright (c) Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system specific imports.
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';

// Application specific imports.
import { ConfigService } from 'src/app/services/config.service';
import { OpenAIService } from 'src/app/services/openai.service';
import { BackendService } from 'src/app/services/backend.service';
import { GeneralService } from 'src/app/services/general.service';

/**
 * Helper component to view feedback as we crawl URLs.
 */
@Component({
  selector: 'app-machine-import-feedback',
  templateUrl: './machine-learning-import-feedback.component.html',
  styleUrls: ['./machine-learning-import-feedback.component.scss']
})
export class MachineLearningImportFeedbackComponent implements OnInit, OnDestroy {

  private hubConnection: HubConnection = null;
  public messages: any[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private backendService: BackendService,
    private generalService: GeneralService,
    private openAIService: OpenAIService,
    private configService: ConfigService) { }

  ngOnInit() {

    this.configService.getGibberish(10, 20).subscribe({

      next: (result: any) => {

        let builder = new HubConnectionBuilder();
        this.hubConnection = builder.withUrl(this.backendService.active.url + '/sockets', {
          accessTokenFactory: () => this.backendService.active.token.token,
          skipNegotiation: true,
          transport: HttpTransportType.WebSockets,
        }).build();
    
        this.hubConnection.on(result.result, (args) => {

          const messageWrapper = document.getElementById('messageWrapper');
          let shouldScroll= false;
          if(messageWrapper.scrollTop + 50 > (messageWrapper.scrollHeight - messageWrapper.offsetHeight)) {
            shouldScroll = true;
          }
        
          args = JSON.parse(args);
          this.messages.push(args);
    
          if (args.type === 'success') {
    
            this.generalService.showFeedback('Done creating bot', 'successMessage');
            if (this.data.callback) {
              this.data.callback();
            }
            
          } else if (args.type === 'warning') {
    
            this.generalService.showFeedback(args.message);
    
          } else if (args.type === 'error') {
    
            this.generalService.showFeedback(args.message, 'errorMessage');
          }

          if(shouldScroll) {
            setTimeout(() => {
    
            const domEl = document.getElementById('m_' + (this.messages.length - 1));
              domEl.scrollIntoView();
            }, 50);
          }
        });
    
        this.hubConnection.start().then(() => {
    
          if (this.data.mode === 'site') {
            this.openAIService.importUrl(
              this.data.url,
              this.data.type,
              this.data.delay,
              this.data.max,
              this.data.threshold,
              this.data.summarize,
              this.data.insert_url,
              result.result,
              this.data.images,
              this.data.lists,
              this.data.code).subscribe({
              next: () => {
    
                this.generalService.hideLoading();
                this.generalService.showFeedback('Crawling started, you will be notified when it is finished', 'successMessage');
              },
              error: (error: any) => {
    
                this.generalService.hideLoading();
                this.messages.push({
                  type: 'error',
                  message: error.error.message ?? error,
                });
                this.generalService.showFeedback('Something went wrong as we tried to start import', 'errorMessage');
              }
            });
          } else if (this.data.mode === 'single-page') {
            this.openAIService.importPage(
              this.data.url,
              this.data.type,
              50,
              result.result,
              this.data.images,
              this.data.lists,
              this.data.code).subscribe({
              next: () => {
    
                this.generalService.hideLoading();
              },
              error: () => {
    
                this.generalService.hideLoading();
                this.generalService.showFeedback('Something went wrong as we tried to spice your model', 'errorMessage');
              }
            });
          } else if (this.data.mode === 'vectorize') {

            this.openAIService.vectorise(this.data.type, result.result).subscribe({
              next: () => {

                this.generalService.hideLoading();
              },
              error: () => {

                this.generalService.hideLoading();
                this.generalService.showFeedback('Something went wrong as we tried to create embeddings for model', 'errorMessage');
              }
            });

          } else if (this.data.mode === 'url-list') {

            // Uploading a URL set.
            const formData = new FormData();
            formData.append('file', this.data.urlList[0]);
            formData.append('type', this.data.type);
            formData.append('vectorize', this.data.vectorize);
            formData.append('feedback-channel', result.result);
            this.generalService.showLoading()
            this.openAIService.uploadUrlList(formData).subscribe({

              next: (result: any) => {

                // Success uploading file.
                this.generalService.hideLoading();
                this.generalService.showFeedback('File containing ' + result.count + ' URLs successfully uploaded', 'successMessage');
              },

              error: () => {

                this.generalService.hideLoading();
                this.generalService.showFeedback('Something went wrong as we tried to upload and scrape your URL list, check the log for more details', 'errorMessage');
              }
            });
          }
        });
      },
      error: () => {

        this.generalService.hideLoading();
        this.generalService.showFeedback('Something went wrong as we tried to start import', 'errorMessage');
      }
    });
  }

  ngOnDestroy() {

    this.hubConnection?.stop();
  }
}
