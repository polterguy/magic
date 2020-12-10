
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

// Application specific imports.
import { BaseComponent } from '../base.component';
import { Response } from '../../models/response.model';
import { MessageService } from 'src/app/services/message.service';
import { EvaluatorService } from 'src/app/services/evaluator.service';
import { Model } from '../codemirror/hyperlambda/hyperlambda.component';
import { LoadSnippetDialogComponent } from './load-snippet-dialog/load-snippet-dialog.component';

// CodeMirror options.
import hyperlambda from '../codemirror/options/hyperlambda.json'
import hyperlambda_readonly from '../codemirror/options/hyperlambda_readonly.json';

/**
 * Component allowing user to evaluate Hyperlambda snippets.
 */
@Component({
  selector: 'app-evaluator',
  templateUrl: './evaluator.component.html',
  styleUrls: ['./evaluator.component.scss']
})
export class EvaluatorComponent extends BaseComponent implements OnInit {

  /**
   * Input Hyperlambda component model and options.
   */
  public input: Model = {
    hyperlambda: '',
    options: hyperlambda,
  };

  /**
   * Output Hyperlambda component model and options.
   */
  public output: Model = {
    hyperlambda: '',
    options: hyperlambda_readonly,
  };

  /**
   * Creates an instance of your component.
   * 
   * @param messageService Service used to publish messages to other components
   */
  constructor(
    protected messageService: MessageService,
    private dialog: MatDialog,
    private evaluatorService: EvaluatorService) {
    super(messageService);
  }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    // Making sure we attach the F5 button to execute input Hyperlambda.
    this.input.options.extraKeys.F5 = () => {
      (document.getElementById('executeButton') as HTMLElement).click();
    };

    // Associating ALT+M with fullscreen toggling of the editor instance.
    this.input.options.extraKeys['Alt-M'] = (cm: any) => {
      cm.setOption('fullScreen', !cm.getOption('fullScreen'));
    };

    // Associating ALT+L with load snippet button.
    this.input.options.extraKeys['Alt-L'] = (cm: any) => {
      (document.getElementById('loadButton') as HTMLElement).click();
    };
  }

  /**
   * Shows load snippet dialog.
   */
  public load() {
    const dialogRef = this.dialog.open(LoadSnippetDialogComponent, {
      width: '550px',
    });
  }

  /**
   * Executes the Hyperlambda from the input CodeMirror component.
   */
  public execute() {

    // Invoking backend service responsible for executing Hyperlambda.
    this.evaluatorService.execute(this.input.hyperlambda).subscribe((res: Response) => {

      // Success, updating result editor.
      this.output.hyperlambda = res.result;
      this.showInfoShort('Hyperlambda was successfully executed');

    }, (error: any) => this.showError(error));
  }
}
