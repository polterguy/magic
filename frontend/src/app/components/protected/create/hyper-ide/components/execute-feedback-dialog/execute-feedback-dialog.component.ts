
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { HttpTransportType, HubConnectionBuilder } from '@aspnet/signalr';
import { BackendService } from 'src/app/services/backend.service';
import { EvaluatorService } from 'src/app/services/evaluator.service';
import { GeneralService } from 'src/app/services/general.service';
import { ExecuteResultDialog } from '../execute-result-dialog/execute-result-dialog.component';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

/**
 * Modal dialog allowing you to view feedback during execution of some piece of Hyperlambda.
 */
@Component({
  selector: 'app-execute-feedback-dialog',
  templateUrl: './execute-feedback-dialog.component.html',
  styleUrls: ['./execute-feedback-dialog.component.scss']
})
export class ExecuteFeedbackDialog implements OnInit {

  messages: any[] = [];

  /**
   * Creates an instance of your component.
   */
  constructor(
    private dialog: MatDialog,
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
      args.json = JSON.stringify(args.arguments, null, 2);
      this.messages.push(args);
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
          if (!response || response === '') {
  
            this.generalService.showFeedback('Hyperlambda successfully executed but produced no result', 'successMessage');
            return;
          }
  
          this.dialog.open(ExecuteResultDialog, {
            width: '1024px',
            maxWidth: '80vw',
            data: JSON.stringify(response, null, 2),
          });
        },
  
        error: (error: any) => {
  
          this.generalService.hideLoading();
          this.generalService.showFeedback(error?.error?.message ?? error, 'erroorMessage');
        }
      });
    });
  }
}
