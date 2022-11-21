
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { SqlService } from '../../../../services--/sql.service';
import { FeedbackService } from '../../../../services--/feedback.service';

/**
 * Modal dialog data.
 */
export class ModalData {

  /**
   * Database type to save snippet as.
   */
  databaseType: string;

  /**
   * Initial filename to choose when saving file.
   */
  filename: string;
}

/**
 * Save SQL dialog for saving SQL snippets to the backend for later.
 */
@Component({
  selector: 'app-save-sql-dialog',
  templateUrl: './save-sql-dialog.component.html'
})
export class SaveSqlDialogComponent implements OnInit {

  /**
   * Existing snippet files as returned from backend.
   *
   * Needed to make autocompleter working allowing user to overwrite previously saved snippet.
   */
  files: string[] = [];

  /**
   * Creates an instance of your login dialog.
   *
   * @param feedbackService Needed to be able to display feedback to user
   * @param sqlService Needed to retrieve snippets from backend
   * @param data Input data, more specifically the database type the user is currently using
   */
  constructor(
    private feedbackService: FeedbackService,
    private sqlService: SqlService,
    @Inject(MAT_DIALOG_DATA) public data: ModalData) { }

  /**
   * OnInit implementation.
   */
  ngOnInit() {
    this.sqlService.listSnippets(this.data.databaseType).subscribe((files: string[]) => {
      this.files = files.filter(x => x.endsWith('.sql'));
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
      return this.getFilename(idx).indexOf(this.data.filename) !== -1 &&
        this.getFilename(idx) !== this.data.filename;
    });
  }

  /**
   * Returns true if filename is a valid filename for snippet.
   */
  filenameValid() {
    for (var idx of this.data.filename) {
      if ('abcdefghijklmnopqrstuvwxyz0123456789.-_'.indexOf(idx) === -1) {
        return false;
      }
    }
    return true;
  }
}
