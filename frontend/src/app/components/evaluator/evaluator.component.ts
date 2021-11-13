
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

// Application specific imports.
import { Response } from '../../models/response.model';
import { FeedbackService } from '../../services/feedback.service';
import { EvaluatorService } from 'src/app/components/evaluator/services/evaluator.service';
import { Model } from '../codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';
import { LoadSnippetDialogComponent } from './load-snippet-dialog/load-snippet-dialog.component';
import { SaveSnippetDialogComponent } from './save-snippet-dialog/save-snippet-dialog.component';

// CodeMirror options.
import hyperlambda from '../codemirror/options/hyperlambda.json';
import hyperlambda_readonly from '../codemirror/options/hyperlambda_readonly.json';

/**
 * Component allowing user to evaluate Hyperlambda,
 * and load/save snippets for later references to the backend snippet collection.
 */
@Component({
  selector: 'app-evaluator',
  templateUrl: './evaluator.component.html',
  styleUrls: ['./evaluator.components.scss']
})
export class EvaluatorComponent implements OnInit {

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
   * Currently edited snippet.
   */
  public filename: string = null;

  /**
   * Creates an instance of your component.
   * 
   * @param evaluatorService Used to execute Hyperlambda specified by user
   */
  constructor(
    private evaluatorService: EvaluatorService,
    private feedbackService: FeedbackService,
    private dialog: MatDialog) {
  }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    // Associating ALT+L with load snippet button.
    this.input.options.extraKeys['Alt-L'] = (cm: any) => {
      document.getElementById('loadButton').click();
    };

    // Associating ALT+S with save snippet button.
    this.input.options.extraKeys['Alt-S'] = (cm: any) => {
      document.getElementById('saveButton').click();
    };

    // Making sure we attach the F5 button to execute input Hyperlambda.
    this.input.options.extraKeys.F5 = () => {
      document.getElementById('executeButton').click();
    };
  }

  /**
   * Shows load snippet dialog.
   */
  public load() {

    // Showing modal dialog.
    const dialogRef = this.dialog.open(LoadSnippetDialogComponent, {
      width: '550px',
    });

    // Subscribing to closed event, and if given a filename, loads it and displays it in the Hyperlambda editor.
    dialogRef.afterClosed().subscribe((filename: string) => {
      if (filename) {

        // User gave us a filename, hence we load file from backend snippet collection.
        this.evaluatorService.loadSnippet(filename).subscribe((content: string) => {

          // Success! Storing filename for later, and applying the Hyperlambda to CodeMnirror editor as retrieved from backend.
          this.input.hyperlambda = content;
          this.filename = filename;

        }, (error: any) => this.feedbackService.showError(error));
      }
    });
  }

  /**
   * Shows the save snippet dialog.
   */
  public save() {

    // Showing modal dialog, passing in existing filename if any, defaulting to ''.
    const dialogRef = this.dialog.open(SaveSnippetDialogComponent, {
      width: '550px',
      data: this.filename || '',
    });

    // Subscribing to closed event, and if given a filename, loads it and displays it in the Hyperlambda editor.
    dialogRef.afterClosed().subscribe((filename: string) => {

      // Checking if user selected a file, at which point filename will be non-null.
      if (filename) {

        // User gave us a filename, hence saving file to backend snippet collection.
        this.evaluatorService.saveSnippet(filename, this.input.hyperlambda).subscribe((res: any) => {

          // Snippet saved!
          this.feedbackService.showInfo('Snippet successfully saved');
          
        }, (error: any) => this.feedbackService.showError(error));

      }
    });
  }

  /**
   * Executes the Hyperlambda from the input CodeMirror component.
   */
  public execute() {

    // Retrieving selected text from CodeMirror instance.
    const selectedText = this.input.editor.getSelection();

    // Invoking backend service responsible for executing Hyperlambda.
    this.evaluatorService.execute(selectedText == '' ? this.input.hyperlambda : selectedText).subscribe((res: Response) => {

      // Success, updating result editor.
      this.output.hyperlambda = res.result;
      this.feedbackService.showInfoShort('Hyperlambda was successfully executed');

    }, (error: any) => this.feedbackService.showError(error));
  }
}
