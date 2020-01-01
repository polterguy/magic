
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { HttpService } from 'src/app/services/http-service';

export interface DialogData {
  isEdit: boolean;
  entity: any;
  editableFields: string[];
}

@Component({
  templateUrl: '[[filename]]-edit-modal.html',
  styleUrls: ['[[filename]]-edit-modal.scss']
})
export class [[edit-component-name]] {

  constructor(
    public dialogRef: MatDialogRef<[[edit-component-name]]>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private snackBar: MatSnackBar,
    private service: HttpService) { }

  isEditable(name: string) {
    return this.data.editableFields.indexOf(name) !== -1;
  }

  ok() {
    this.service.[[update-method]](this.data.entity).subscribe(res => {
      this.dialogRef.close(this.data.entity);
    }, error => {
      this.snackBar.open(error.error.message, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }
  
  cancel() {
    this.dialogRef.close();
  }
}
