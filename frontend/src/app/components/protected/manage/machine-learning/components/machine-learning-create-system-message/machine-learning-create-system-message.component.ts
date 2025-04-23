
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpTransportType, HubConnectionBuilder } from '@aspnet/signalr';

// Application specific imports.
import { OpenAIService } from 'src/app/services/openai.service';
import { BackendService } from 'src/app/services/backend.service';
import { GeneralService } from 'src/app/services/general.service';

/**
 * Helper component to create a custom system message.
 */
@Component({
  selector: 'app-machine-learning-create-system-message.component',
  templateUrl: './machine-learning-create-system-message.component.html',
  styleUrls: ['./machine-learning-create-system-message.component.scss']
})
export class MachineLearningCreateSystemMessage {

  url: string = '';
  active: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private backendService: BackendService,
    private dialogRef: MatDialogRef<MachineLearningCreateSystemMessage>,
    private openAiService: OpenAIService) { }

  save() {

    this.generalService.showFeedback('This will take a minute or two, please have patience and don\'t close this window or leave this page', 'successMessage');
    this.generalService.showLoading();

    this.active = true;

    // Due to timeouts we have to retrieve system message using sockets.
    const channel = 'c_' + new Date().toISOString();
    let builder = new HubConnectionBuilder();
    const connection = builder.withUrl(this.backendService.active.url + '/sockets', {
      accessTokenFactory: () => this.backendService.active.token.token,
      skipNegotiation: true,
      transport: HttpTransportType.WebSockets,
    }).build();
    connection.on(channel, (args) => {

      args = JSON.parse(args);

      if (args.message === 'ERROR') {

        this.generalService.showFeedback(args.extra, 'errorMessage');

      } else {

        this.dialogRef.close({
          message: args.message,
        });
      }

      this.generalService.hideLoading();
      connection.stop();
      this.active = false;
    });
    connection.start().then(() => {

      this.openAiService.createSystemMessage(
        this.data.instruction,
        this.data.template,
        this.url,
        channel).subscribe({

        next: () => {

          console.log('Successfully started creating personalised system message, please wait');
        },
  
        error: (error: any) => {
  
          this.generalService.hideLoading();
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
          this.active = false;
          connection.stop();
        }
      });

    }).catch(() => {

      this.generalService.hideLoading();
      this.generalService.showFeedback('Could not connect to socket', 'errorMessage');
      this.active = false;
    });
  }
}
