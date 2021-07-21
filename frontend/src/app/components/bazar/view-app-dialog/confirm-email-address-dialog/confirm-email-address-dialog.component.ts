
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Component for having user provide his email address such that we can send the component
 * to him as a ZIP file.
 */
@Component({
  selector: 'app-confirm-email-address-dialog',
  templateUrl: './confirm-email-address-dialog.component.html',
  styleUrls: ['./confirm-email-address-dialog.component.scss']
})
export class ConfirmEmailAddressDialogComponent {

  /**
   * Creates an instance of your component.
   * 
   * @param data Root user's email address
   */
  constructor(
    private dialogRef: MatDialogRef<ConfirmEmailAddressDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string) { }

  /**
   * Invoked when user confirms his email address.
   */
  public ok() {

    // Closing dialog.
    this.dialogRef.close(this.data);
  }

  /**
   * Invoked when user cancels the purchasing process.
   */
   public cancel() {

    // Closing dialog.
    this.dialogRef.close();
  }
}
