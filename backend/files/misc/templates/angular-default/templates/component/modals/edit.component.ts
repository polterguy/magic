import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { HttpService } from 'src/app/services/http-service';
import { DialogComponent, DialogData } from '../../../dialog.component';

/**
 * Modal dialog for editing your existing [[component-header]] entity types, and/or
 * creating new entity types of type [[component-header]].
 */
@Component({
  templateUrl: './edit.[[component-filename]].html',
  styleUrls: ['./edit.[[component-filename]].scss']
})
export class Edit[[component-name]] extends DialogComponent {

  /**
   * Constructor taking a bunch of services injected using dependency injection.
   */
  constructor(
    public dialogRef: MatDialogRef<Edit[[component-name]]>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    protected snackBar: MatSnackBar,
    private service: HttpService) {
    super(snackBar);
    this.createColumns = [[[create-input]]];
    this.updateColumns = [[[update-input]]];
    this.primaryKeys = [[[primary-keys]]];
  }

  /**
   * Returns a reference to ths DialogData that was dependency injected
   * into component during creation.
   */
  protected getData() {
    return this.data;
  }

  /**
   * Returns a reference to the update method, to update entity.
   */
  protected getUpdateMethod() {
    return this.service.[[service-update-method]](this.data.entity);
  }

  /**
   * Returns a reference to the create method, to create new entities.
   */
  protected getCreateMethod() {
    return this.service.[[service-create-method]](this.data.entity);
  }

  /**
   * Closes dialog.
   * 
   * @param data Entity that was created or updated
   */
  public close(data: any) {
    if (data) {
      this.dialogRef.close(data);
    } else {
      this.dialogRef.close();
    }
  }
}
