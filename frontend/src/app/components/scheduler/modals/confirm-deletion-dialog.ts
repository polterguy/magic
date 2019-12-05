
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

export interface DialogData {
  task: string;
}

@Component({
  templateUrl: 'confirm-deletion-dialog.html',
})
export class ConfirmDeletionTaskDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<ConfirmDeletionTaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  close(): void {
    this.dialogRef.close();
  }
}
