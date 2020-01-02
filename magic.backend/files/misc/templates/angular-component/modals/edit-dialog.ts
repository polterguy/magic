/*
 * Magic, Copyright(c) Thomas Hansen 2019, thomas@servergardens.com, all rights reserved.
 * See the enclosed LICENSE file for details.
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { HttpService } from 'src/app/services/http-service';

/*
 * Input data to dialog.
 * Notice, if dialog is instantiated in "create entity mode", the
 * entity property will be an empty object, with no fields.
 */
export interface DialogData {
  isEdit: boolean;
  entity: any;
}

/*
 * Modal dialog for editing your existing [[filename]] entity types, and/or
 * creating new entity types.
 */
@Component({
  templateUrl: '[[filename]]-edit-modal.html',
  styleUrls: ['[[filename]]-edit-modal.scss']
})
export class [[edit-component-name]] {

  /*
   * Constructor taking a bunch of services injected using dependency injection.
   */
  constructor(
    public dialogRef: MatDialogRef<[[edit-component-name]]>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private snackBar: MatSnackBar,
    private service: HttpService) { }

  /*
   * Invoked when the user clicks the "Save" button.
   */
  save() {

    /*
     * Checking if we're editing an existing entity type, or if we're
     * creating a new instance.
     */
    if (this.data.isEdit) {

      // Updating existing item. Invoking update HTTP REST endpoint and closing dialog.
      this.service.[[update-method]](this.data.entity).subscribe(res => {
        this.dialogRef.close(this.data.entity);
      }, error => {

        // Oops, error!
        this.snackBar.open(error.error.message, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      });
    } else {

      // Creating new item. Invoking create HTTP REST endpoint and closing dialog.
      this.service.[[create-method]](this.data.entity).subscribe(res => {
        this.dialogRef.close(this.data.entity);
      }, error => {

        // Oops, error!
        this.snackBar.open(error.error.message, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      });
    }
  }
  
  // Invoked when user cancels edit/create operation.
  cancel() {
    this.dialogRef.close();
  }
}
