
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Clipboard } from '@angular/cdk/clipboard';
import { HttpTransportType, HubConnectionBuilder } from '@aspnet/signalr';
import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';

// Application specific imports.
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BackendService } from 'src/app/services/backend.service';
import { GeneralService } from 'src/app/services/general.service';
import { EvaluatorService } from 'src/app/services/evaluator.service';

/**
 * Modal dialog allowing you to view feedback during execution of some piece of Hyperlambda,
 * in addition to the result of execution.
 */
@Component({
  selector: 'app-execute-feedback-dialog',
  templateUrl: './execute-feedback-dialog.component.html',
  styleUrls: ['./execute-feedback-dialog.component.scss']
})
export class ExecuteFeedbackDialog implements OnInit {

  messages: any[] = [];
  result: string = null;
  hasError: boolean = null;

  /**
   * Creates an instance of your component.
   */
  constructor(
    private clipBoard: Clipboard,
    private generalService: GeneralService,
    private backendService: BackendService,
    private evaluatorService: EvaluatorService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {

    // Executing selected Hyperlambda or all Hyperlambda.
    this.generalService.showLoading();

    let builder = new HubConnectionBuilder();

    const hubConnection = builder.withUrl(this.backendService.active.url + '/sockets', {
      accessTokenFactory: () => this.backendService.active.token.token,
      skipNegotiation: true,
      transport: HttpTransportType.WebSockets,
    }).build();

    hubConnection.on('magic.workflows.action', (args) => {

      args = JSON.parse(args);

      if (args.type === 'action') {

        if (args.input) {
          args.input = JSON.stringify(args.input, null, 2);
        }
  
        this.messages.push(args);

      } else if (args.type === 'result') {

        if (args.output) {
          this.messages[this.messages.length - 1].output = JSON.stringify(args.output, null, 2);
        }
  
        this.messages[this.messages.length - 1].time == args.time;

      } else if (args.type === 'error') {

        this.messages[this.messages.length - 1].error = args.message;
      }

      this.cdr.detectChanges();
    });

    hubConnection.start().then(() => {

      this.evaluatorService.executeWithArgs(this.data.hyperlambda, this.data.args).subscribe({

        next: (response: any) => {
  
          // In case we've got queued messages we wait 500 milliseconds before we stop connection.
          setTimeout(() => {
            hubConnection.stop();
          }, 500);

          this.generalService.hideLoading();
          if (response) {

            this.result = JSON.stringify(response, null, 2);
          }
          this.hasError = false;
        },
  
        error: (error: any) => {
  
          this.generalService.hideLoading();
          this.hasError = true;
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        }
      });
    });
  }

  copy() {

    this.clipBoard.copy(this.result);
    this.generalService.showFeedback('You can find the content on your clipboard', 'successMessage');
  }
}
