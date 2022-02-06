
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { MatDialogRef } from '@angular/material/dialog';
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { FeedbackService } from '../../../../services/feedback.service';
import { EvaluatorService } from 'src/app/components/tools/evaluator/services/evaluator.service';

/**
 * Load snippet dialog for loading saved snippets from the backend.
 */
@Component({
  selector: 'app-load-snippet-dialog',
  templateUrl: './load-snippet-dialog.component.html',
  styleUrls: ['./load-snippet-dialog.component.scss']
})
export class LoadSnippetDialogComponent implements OnInit {

  /**
   * Snippet files as returned from backend.
   */
  public files: string[] = [];

  /**
   * Filter for filtering files to display.
   */
  public filter: string = '';

  /**
   * Creates an instance of your login dialog.
   * 
   * @param dialogRef Necessary to close dialog when user selects a snippet
   * @param evaluatorService Evaluator service needed to retrieve snippet files from backend
   */
  constructor(
    private dialogRef: MatDialogRef<LoadSnippetDialogComponent>,
    private evaluatorService: EvaluatorService,
    private feedbackService: FeedbackService) { }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    // Retrieving snippets from backend.
    this.evaluatorService.snippets().subscribe((files: string[]) => {
      this.files = files.filter(x => x.endsWith('.hl'));
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Returns files that matches current filter, if any.
   */
  public getFiles() {
    if (this.filter === '') {
      return this.files;
    } else {
      return this.files.filter(x => this.getFilename(x).indexOf(this.filter) !== -1);
    }
  }

  /**
   * Returns only the filename parts from the given full path and filename.
   * 
   * @param path Complete path of file
   */
  public getFilename(path: string) {
    const result = path.substr(path.lastIndexOf('/') + 1);
    return result.substr(0, result.lastIndexOf('.'));
  }

  /**
   * Invoked when user selects a file.
   */
  public select(filename: string) {
    this.dialogRef.close(this.getFilename(filename));
  }
}
