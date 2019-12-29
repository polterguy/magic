
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

export interface DialogData {
  name: string;
}

@Component({
  templateUrl: 'create-role-dialog.html',
})
export class CreateRoleDialogComponent {
  private name: string = null;

  constructor(
    public dialogRef: MatDialogRef<CreateRoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

  close() {
    this.dialogRef.close();
  }
}
