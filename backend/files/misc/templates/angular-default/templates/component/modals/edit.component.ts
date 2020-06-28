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
 * Modal dialog for editing your existing [[component-header]] entity types, and/or
 * creating new entity types.
 */
@Component({
  templateUrl: './edit.[[component-filename]].html',
  styleUrls: ['./edit.[[component-filename]].scss']
})
export class Edit[[component-name]] {

  /*
   * Only the following properties of the given data.entity will actually
   * be transmitted to the server when we create records. This is done to
   * make sure we don't submit "automatic" primary key values.
   */
  private createColumns: string[] = [[[create-input]]];
  private updateColumns: string[] = [[[update-input]]];
  private primaryKeys: string[] = [[[primary-keys]]];

  /*
   * Constructor taking a bunch of services injected using dependency injection.
   */
  constructor(
    public dialogRef: MatDialogRef<Edit[[component-name]]>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private snackBar: MatSnackBar,
    private service: HttpService) { }

  canEditColumn(name: string) {
    if (this.data.isEdit) {
      return this.updateColumns.filter(x => x === name).length > 0 &&
        this.primaryKeys.filter(x => x === name).length == 0;
    }
    return this.createColumns.filter(x => x === name).length > 0;
  }

  /*
   * Invoked when the user clicks the "Save" button.
   */
  save() {

    /*
     * Checking if we're editing an existing entity type, or if we're
     * creating a new instance.
     */
    if (this.data.isEdit) {

      /*
       * Removing all columns that we're not supposed to transmit during "edit mode".
       */
      for (const idx in this.data.entity) {
        if (this.updateColumns.indexOf(idx) === -1) {
          delete this.data.entity[idx];
        }
      }

      // Updating existing item. Invoking update HTTP REST endpoint and closing dialog.
      this.service.[[service-update-method]](this.data.entity).subscribe(res => {
        this.dialogRef.close(this.data.entity);
        if (res['updated-records'] !== 1) {

          // Oops, error!
          this.snackBar.open(`Oops, number of items was ${res['updated-records']}, which is very wrong. Should have been 1`, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        }
      }, error => {

        // Oops, error!
        this.snackBar.open(error.error.message, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      });
    } else {

      /*
       * Removing all columns that we're not supposed to transmit during "create mode".
       */
      for (const idx in this.data.entity) {
        if (this.createColumns.indexOf(idx) === -1) {
          delete this.data.entity[idx];
        }
      }

      // Creating new item. Invoking create HTTP REST endpoint and closing dialog.
      this.service.[[service-create-method]](this.data.entity).subscribe(res => {
        this.dialogRef.close(this.data.entity);

        if (res === null || res === undefined) {
          // Oops, error!
          this.snackBar.open(`Oops, for some reasons backend returned ${res}, which seems to be very wrong!`, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        }
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
