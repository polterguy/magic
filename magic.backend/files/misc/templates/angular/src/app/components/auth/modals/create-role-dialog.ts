
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { AuthService } from 'src/app/auth-service';

export interface DialogData {
  name: string;
}

@Component({
  templateUrl: 'create-role-dialog.html',
})
export class CreateRoleDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<CreateRoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private authService: AuthService) { }

  ok() {
    this.authService.createRole(this.data.name).subscribe(res => {
      this.dialogRef.close(this.data);
    });
  }
  
  cancel() {
    this.dialogRef.close();
  }
}
