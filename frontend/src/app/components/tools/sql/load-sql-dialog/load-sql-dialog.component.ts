
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { SqlService } from '../../../../services--/sql.service';
import { FeedbackService } from '../../../../services--/feedback.service';

/**
 * Load snippet dialog for loading saved snippets from the backend.
 */
@Component({
  selector: 'app-load-sql-dialog',
  templateUrl: './load-sql-dialog.component.html',
  styleUrls: ['./load-sql-dialog.component.scss']
})
export class LoadSqlDialogComponent implements OnInit {

  /**
   * Snippet files as returned from backend.
   */
  files: string[] = [];

  /**
   * Filter for filtering files to display.
   */
  filter: string = '';

  /**
   * Creates an instance of your login dialog.
   *
   * @param dialogRef Needed to be able to close dialog as user selects a snippet
   * @param feedbackService Needed to be able to display feedback to user
   * @param sqlService Needed to retrieve snippets from backend
   * @param data Input data, more specifically the database type the user is currently using
   */
  constructor(
    private dialogRef: MatDialogRef<LoadSqlDialogComponent>,
    private feedbackService: FeedbackService,
    private sqlService: SqlService,
    @Inject(MAT_DIALOG_DATA) public data: string) { }

  /**
   * OnInit implementation.
   */
  ngOnInit() {
    this.sqlService.listSnippets(this.data).subscribe((files: string[]) => {
      this.files = files.filter(x => x.endsWith('.sql'));
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Returns files that matches current filter, if any.
   */
  getFiles() {
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
  getFilename(path: string) {
    const result = path.substring(path.lastIndexOf('/') + 1);
    return result.substring(0, result.lastIndexOf('.'));
  }

  /**
   * Invoked when user selects a file.
   */
  select(filename: string) {
    this.dialogRef.close(this.getFilename(filename));
  }
}
