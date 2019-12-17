
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

export interface DialogData {
  name: string;
  description: string;
}

@Component({
  templateUrl: 'new-role-dialog.html',
})
export class NewRoleDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<NewRoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  close(): void {
    this.dialogRef.close();
  }
}
