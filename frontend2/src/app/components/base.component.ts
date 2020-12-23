
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// Application specific imports.
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm/confirm-dialog.component';

 /**
  * Base component that most other components inherits from.
  * 
  * This class provides common functionality for other components,
  * such as the ability to display information and errors to the user,
  * etc.
  */
export abstract class BaseComponent {

  /**
   * Message service used to send messages and receive messages from other components.
   */
  protected snackBar: MatSnackBar;

  /**
   * Dialog reference used to create modal dialogs used by for instance the confirm method.
   */
  protected dialog: MatDialog;

  /**
   * Creates an instance of your class.
   * 
   * @param injector Injector to use to resolve instances of types
   */
  constructor(protected injector: Injector) {
    this.snackBar = injector.get(MatSnackBar);
    this.dialog = injector.get(MatDialog);
  }

  /**
   * Shows a message with some information to the user.
   * 
   * @param content Message to show
   */
  protected showInfo(content: string) {
    this.snackBar.open(content, null, {
      duration: 5000,
    });
  }

  /**
   * Shows a short message with some information to the user.
   * 
   * @param content Message to show
   */
  protected showInfoShort(content: string) {
    this.snackBar.open(content, null, {
      duration: 500,
    });
  }

  /**
   * Shows an error message with some information to the user.
   * 
   * @param content Error message to show, or object containing error message as returned from backend
   */
  protected showError(content: any) {
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
  protected confirm(title: string, text: string, confirmed: () => void) {

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
