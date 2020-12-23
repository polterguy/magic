
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// Application specific imports.
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../components/confirm/confirm-dialog.component';

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
  public showInfo(content: string) {
    this.snackBar.open(content, null, {
      duration: 5000,
    });
  }

  /**
   * Shows a short message with some information to the user.
   * 
   * @param content Message to show
   */
  public showInfoShort(content: string) {
    this.snackBar.open(content, null, {
      duration: 500,
    });
  }

  /**
   * Shows an error message with some information to the user.
   * 
   * @param content Error message to show, or object containing error message as returned from backend
   */
  public showError(content: any) {
    this.snackBar.open(content.error?.message || content, null, {
      duration: 5000,
    });
  }

  /**
   * Creates a confirm action modal dialog, asking user to confirm action, invoking callback if confirmation is given.
   * 
   * @param title Title of modal dialog
   * @param text Content of modal dialog
   * @param confirmed Callback invoked if user confirms action
   */
  public confirm(title: string, text: string, confirmed: () => void) {

    // Asking user to confirm deletion of file object.
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '550px',
      data: {
        title,
        text,
      }
    });

    // Subscribing to close such that we can delete schedule if it's confirmed.
    dialogRef.afterClosed().subscribe((result: ConfirmDialogData) => {

      // Checking if user confirmed that he wants to delete the schedule.
      if (result && result.confirmed) {

        // Invoking callback provided by caller.
        confirmed();
      }
    });
  }
}
