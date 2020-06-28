
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

export interface NewFileDialogData {
  filename: string;
  header: string;
  path: string;
}

@Component({
  templateUrl: 'new-file-dialog.html',
})
export class NewFileDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<NewFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NewFileDialogData) {}

  close(): void {
    this.dialogRef.close();
  }
}
