
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

export interface DialogData {
  file: string;
}

@Component({
  templateUrl: 'confirm-deletion-dialog.html',
})
export class ConfirmDeletionDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<ConfirmDeletionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  close(): void {
    this.dialogRef.close();
  }
}
