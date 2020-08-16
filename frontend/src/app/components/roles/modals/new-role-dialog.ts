
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface NewRoleDialogData {
  name: string;
  description: string;
}

@Component({
  templateUrl: 'new-role-dialog.html',
})
export class NewRoleDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<NewRoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NewRoleDialogData) {}

  close(): void {
    this.dialogRef.close();
  }
}
