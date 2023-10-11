
/*
 * Copyright (c) Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import { BackendService } from 'src/app/_general/services/backend.service';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';

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
    private openAIService: OpenAIService) { }

  ngOnDestroy() {

    this.hubConnection?.stop();
  }

  ngOnInit() {

    let builder = new HubConnectionBuilder();
    this.hubConnection = builder.withUrl(this.backendService.active.url + '/sockets', {
      accessTokenFactory: () => this.backendService.active.token.token,
      skipNegotiation: true,
      transport: HttpTransportType.WebSockets,
    }).build();

    this.hubConnection.on('magic.backend.chatbot', (args) => {

      args = JSON.parse(args);
      this.messages.push(args);

      if (args.type === 'success') {

        this.generalService.showFeedback('Done creating bot', 'successMessage');

      } else if (args.type === 'warning') {

        this.generalService.showFeedback(args.message);

      } else if (args.type === 'error') {

        this.generalService.showFeedback(args.message, 'errorMessage');
      }
      setTimeout(() => {

        const domEl = document.getElementById('m_' + (this.messages.length - 1));
        domEl.scrollIntoView()
      }, 50);
    });

    this.hubConnection.start().then(() => {

      this.generalService.showLoading();
      if (this.data.site === true) {
        this.openAIService.importUrl(
          this.data.url,
          this.data.type,
          this.data.delay,
          this.data.max,
          this.data.threshold,
          this.data.summarize).subscribe({
          next: () => {

            this.generalService.hideLoading();
            this.generalService.showFeedback('Crawling started, you will be notified when it is finished', 'successMessage');
          },
          error: () => {

            this.generalService.hideLoading();
            this.generalService.showFeedback('Something went wrong as we tried to start import', 'errorMessage');
          }
        });
      } else {
        this.openAIService.importPage(this.data.url, this.data.type, 50).subscribe({
          next: () => {

            this.generalService.hideLoading();
          },
          error: () => {

            this.generalService.hideLoading();
            this.generalService.showFeedback('Something went wrong as we tried to spice your model', 'errorMessage');
          }
        });
    }
    });
  }
}
