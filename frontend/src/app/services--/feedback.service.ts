
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// Application specific imports.
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../_general/components/confirm/confirm-dialog.component';

 /**
  * Feedback service allowing you to show feedback to users, such as
  * information, confirmation modal dialogs, etc.
  */
 @Injectable({
  providedIn: 'root'
})
export abstract class FeedbackService {

  /**
   * Creates an instance of your class.
   * 
   * @param snackBar Used to provide feedback to user
   * @param dialog Needed to create modal dialogs
   */
  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog) { }

  /**
   * Shows a message with some information to the user.
   * 
   * @param content Message to show
   */
  showInfo(content: string) {
    this.snackBar.open(content, null, {
      duration: 5000,
    });
  }

  /**
   * Shows a short message with some information to the user.
   * 
   * @param content Message to show
   */
  showInfoShort(content: string) {
    this.snackBar.open(content, null, {
      duration: 2000,
      panelClass: 'center-aligned'
    });
  }

  /**
   * Shows an error message with some information to the user.
   * 
   * @param content Error message to show, or object containing error message as returned from backend
   */
  showError(content: any) {
    this.snackBar.open(content.error?.message || content, null, {
      duration: 5000,
      panelClass: ['error-snack-bar']
    });
  }

  /**
   * Creates a confirm action modal dialog, asking user to confirm action, invoking callback if confirmation is given.
   * 
   * @param title Title of modal dialog
   * @param text Content of modal dialog
   * @param confirmed Callback invoked if user confirms action
   */
  confirm(title: string, text: string, confirmed: (result?: any) => void, cancel: (cancel?: any) => void = null) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '550px',
      data: {
        title,
        text,
      }
    });
    dialogRef.afterClosed().subscribe((result: ConfirmDialogData) => {
      if (result && result.confirmed) {
        confirmed(result?.confirmed);
      } else if (cancel) {
        cancel(result?.confirmed);
      }
    });
  }
}
