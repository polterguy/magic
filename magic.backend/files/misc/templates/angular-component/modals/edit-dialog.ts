
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { HttpService } from 'src/app/services/http-service';

export interface DialogData {
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
    this.service.[[update-method]](this.data).subscribe(res => {
      this.dialogRef.close(this.data);
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
