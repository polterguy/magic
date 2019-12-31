
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { HttpService } from 'src/app/services/http-service';

export interface DialogData {
}

@Component({
  templateUrl: '[[filename]]-edit-modal.html',
})
export class [[edit-component-name]] {

  constructor(
    public dialogRef: MatDialogRef<[[edit-component-name]]>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private snackBar: MatSnackBar,
    private service: HttpService) { }

  ok() {
    this.service.[[update-method]](this.data).subscribe(res => {
      this.dialogRef.close(this.data);
      this.snackBar.open('Item successfully updated', 'Close', {
        duration: 2000,
      });
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
