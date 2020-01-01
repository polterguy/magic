
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { HttpService } from 'src/app/services/http-service';

export interface DialogData {
  isEdit: boolean;
  entity: any;
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

  ok() {
    if (this.data.isEdit) {
      this.service.[[update-method]](this.data.entity).subscribe(res => {
        this.dialogRef.close(this.data.entity);
      }, error => {
        this.snackBar.open(error.error.message, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      });
    } else {
      this.service.[[create-method]](this.data.entity).subscribe(res => {
        this.dialogRef.close(this.data.entity);
      }, error => {
        this.snackBar.open(error.error.message, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      });
    }
  }
  
  cancel() {
    this.dialogRef.close();
  }
}
