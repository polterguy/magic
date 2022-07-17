
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { FeedbackService } from '../../../../services/feedback.service';
import { EvaluatorService } from 'src/app/components/misc/evaluator/services/evaluator.service';

/**
 * Save snippet dialog for saving snippets to the backend for later.
 */
@Component({
  selector: 'app-save-snippet-dialog',
  templateUrl: './save-snippet-dialog.component.html'
})
export class SaveSnippetDialogComponent implements OnInit {

  /*
   * Existing snippet files as returned from backend.
   * 
   * Needed to make autocompleter working allowing user to overwrite previously saved snippet.
   */
  private files: string[] = [];

  /**
   * Creates an instance of your login dialog.
   * 
   * @param evaluatorService Evaluator service needed to retrieve snippet files from backend
   * @param feedbackService Needed to be able to display feedback to user
   * @param data Filename to intially populate filename textbox with. Typically only supplied if you previously loaded a file.
   */
  constructor(
    private evaluatorService: EvaluatorService,
    private feedbackService: FeedbackService,
    @Inject(MAT_DIALOG_DATA) public data: string) { }

  /**
   * OnInit implementation.
   */
  ngOnInit() {
    this.evaluatorService.snippets().subscribe((files: string[]) => {
      this.files = files.filter(x => x.endsWith('.hl'));
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Returns only the filename parts from the given full path and filename.
   * 
   * @param path Complete path of file
   */
  getFilename(path: string) {
    const result = path.substring(path.lastIndexOf('/') + 1);
    return result.substring(0, result.lastIndexOf('.'));
  }

  /**
   * Returns filtered files according to what user has typed.
   */
  getFiltered() {
    return this.files.filter((idx: string)  => {
      return this.getFilename(idx).indexOf(this.data) !== -1 &&
        this.getFilename(idx) !== this.data;
    });
  }

  /**
   * Returns true if filename is a valid filename for snippet.
   */
  filenameValid() {
    for (var idx of this.data) {
      if ('abcdefghijklmnopqrstuvwxyz0123456789.-_'.indexOf(idx) === -1) {
        return false;
      }
    }
    return this.data.length > 0;
  }
}
