
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

// Application specific imports.
import { Response } from '../../../models/response.model';
import { FeedbackService } from '../../../services--/feedback.service';
import { EvaluatorService } from 'src/app/_protected/services/common/evaluator.service';
import { Model } from '../../utilities/codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';
import { LoadSnippetDialogComponent } from './load-snippet-dialog/load-snippet-dialog.component';
import { SaveSnippetDialogComponent } from './save-snippet-dialog/save-snippet-dialog.component';

// CodeMirror options.
import hyperlambda from '../../utilities/codemirror/options/hyperlambda.json';
import hyperlambda_readonly from '../../utilities/codemirror/options/hyperlambda_readonly.json';

/**
 * Component allowing user to evaluate Hyperlambda,
 * and load/save snippets for later references to the backend snippet collection.
 */
@Component({
  selector: 'app-evaluator',
  templateUrl: './evaluator.component.html'
})
export class EvaluatorComponent implements OnInit {

  /**
   * Input Hyperlambda component model and options.
   */
  input: Model = {
    hyperlambda: '',
    options: hyperlambda,
  };

  /**
   * Output Hyperlambda component model and options.
   */
  output: Model = {
    hyperlambda: '',
    options: hyperlambda_readonly,
  };

  /**
   * Currently edited snippet.
   */
  filename: string = null;

  /**
   * Creates an instance of your component.
   *
   * @param evaluatorService Used to execute Hyperlambda specified by user
   * @param feedbackService Needed to display feedback to user
   * @param dialog Needed to be able to create model dialogs
   */
  constructor(
    private evaluatorService: EvaluatorService,
    private feedbackService: FeedbackService,
    private dialog: MatDialog) { }

  /**
   * OnInit implementation.
   */
  ngOnInit() {
    this.input.options.extraKeys['Alt-L'] = (cm: any) => {
      document.getElementById('loadButton').click();
    };
    this.input.options.extraKeys['Alt-S'] = (cm: any) => {
      document.getElementById('saveButton').click();
    };
    this.input.options.extraKeys.F5 = () => {
      document.getElementById('executeButton').click();
    };
  }

  /**
   * Shows load snippet dialog.
   */
  load() {
    const dialogRef = this.dialog.open(LoadSnippetDialogComponent, {
      width: '550px',
    });
    dialogRef.afterClosed().subscribe((filename: string) => {
      if (filename) {
        this.evaluatorService.loadSnippet(filename).subscribe({
          next: (content: string) => {
            this.input.hyperlambda = content;
            this.filename = filename;

            setTimeout(() => {
              var domNode = (<any>document.querySelector('.CodeMirror'));
              var editor = domNode.CodeMirror;
              editor.doc.markClean();
              editor.doc.clearHistory(); // To avoid having initial loading of file becoming an "undo operation".
            }, 1);
          },
          error: (error: any) => this.feedbackService.showError(error)});
      }
    });
  }

  /**
   * Shows the save snippet dialog.
   */
  save() {
    const dialogRef = this.dialog.open(SaveSnippetDialogComponent, {
      width: '550px',
      data: this.filename || '',
    });
    dialogRef.afterClosed().subscribe((filename: string) => {
      if (filename) {
        this.evaluatorService.saveSnippet(filename, this.input.hyperlambda).subscribe({
          next: () => this.feedbackService.showInfo('Snippet successfully saved'),
          error: (error: any) => this.feedbackService.showError(error)});
      }
    });
  }

  /**
   * Executes the Hyperlambda from the input CodeMirror component.
   */
  execute() {
    const selectedText = this.input.editor.getSelection();
    this.evaluatorService.execute(selectedText == '' ? this.input.hyperlambda : selectedText).subscribe({
      next: (res: Response) => {
        this.output.hyperlambda = res.result;
        this.feedbackService.showInfoShort('Hyperlambda was successfully executed');
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }
}
