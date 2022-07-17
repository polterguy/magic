
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Modal dialog simply displaying app's README file, and nothing else.
 */
@Component({
  selector: 'app-view-readme-dialog',
  templateUrl: './view-readme-dialog.component.html'
})
export class ViewReadmeDialogComponent {

  /**
   * Creates an instance of your component.
   * 
   * @param data The markdown of the README file user wants to see
   * @param dialogRef Needed to be able to close window once he is finished reading the README file
   */
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: string,
    private dialogRef: MatDialogRef<ViewReadmeDialogComponent>) { }

  /**
   * Invoked when user wants to close the modal dialog displaying the app's README file.
   */
  close() {
    this.dialogRef.close();
  }
}
