
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

export interface NewUserDialogData {
  username: string;
  password: string;
}

@Component({
  templateUrl: 'new-user-dialog.html',
})
export class NewUserDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<NewUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NewUserDialogData) {}

  close(): void {
    this.dialogRef.close();
  }
}
