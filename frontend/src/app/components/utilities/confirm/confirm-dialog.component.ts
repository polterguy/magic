
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Data for confirm dialog.
 */
export class ConfirmDialogData {

  /**
   * Confirmation text to display to user.
   */
  text: string;

  /**
   * Title for dialog.
   */
  title: string = 'Confirm action';

  /**
   * If this value is true when dialog is closed, the user confirmed the action,
   * otherwise the action was not confirmed.
   */
  confirmed?: boolean;
}

/**
 * Confirm dialog shown when user has to explicitly confirm an action of some sort.
 */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html'
})
export class ConfirmDialogComponent {

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Dialog reference, necessary to be able to close dialog from code
   */
  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData) { }

  /**
   * Invoked when user clicks yes to confirm the action.
   */
  yes() {
    this.data.confirmed = true;
    this.dialogRef.close(this.data);
  }

  /**
   * Invoked when user clicks no to regret the action.
   */
  no() {
    this.data.confirmed = false;
    this.dialogRef.close(this.data);
  }
}
