
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDeleteDialogData {
  file: string;
}

@Component({
  templateUrl: 'confirm-deletion-dialog.html',
})
export class ConfirmDeletionDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<ConfirmDeletionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDeleteDialogData) {}

  close(): void {
    this.dialogRef.close();
  }
}
