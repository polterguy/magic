
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, Injector, OnInit } from '@angular/core';

// Application specific imports.
import { FeedbackService } from '../../../services/feedback.service';
import { SqlService } from 'src/app/services/sql.service';

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
  templateUrl: './save-sql-dialog.component.html',
  styleUrls: ['./save-sql-dialog.component.scss']
})
export class SaveSqlDialogComponent implements OnInit {

  /**
   * Existing snippet files as returned from backend.
   * 
   * Needed to make autocompleter working allowing user to overwrite previously saved snippet.
   */
  public files: string[] = [];

  /**
   * Creates an instance of your login dialog.
   * 
   * @param sqlService Evaluator service needed to retrieve snippet files from backend
   * @param data Filename to intially populate filename textbox with, and databaseType. Typically only supplied if you previously loaded a file.
   */
  constructor(
    private feedbackService: FeedbackService,
    private sqlService: SqlService,
    @Inject(MAT_DIALOG_DATA) public data: ModalData) { }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    // Retrieving SQL snippets from backend.
    this.sqlService.snippets(this.data.databaseType).subscribe((files: string[]) => {

      // Excluding all files that are not SQL files.
      this.files = files.filter(x => x.endsWith('.sql'));

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Returns only the filename parts from the given full path and filename.
   * 
   * @param path Complete path of file
   */
  public getFilename(path: string) {

    // Removing path and extension, returning only filename.
    const result = path.substr(path.lastIndexOf('/') + 1);
    return result.substr(0, result.lastIndexOf('.'));
  }

  /**
   * Returns filtered files according to what user has typed.
   */
  public getFiltered() {

    // Filtering files according such that only filtered files are returned.
    return this.files.filter((idx: string)  => {
      return this.getFilename(idx).indexOf(this.data.filename) !== -1;
    });
  }

  /**
   * Returns true if filename is a valid filename for snippet.
   */
  public filenameValid() {

    // A valid filename only contains [a-z], [0-9], '.' and '-'.
    for (var idx of this.data.filename) {
      if ('abcdefghijklmnopqrstuvwxyz0123456789.-'.indexOf(idx) === -1) {
        return false;
      }
    }
    return true;
  }
}
