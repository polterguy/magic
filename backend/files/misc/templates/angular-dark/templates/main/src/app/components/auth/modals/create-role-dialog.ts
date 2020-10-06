import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { AuthService } from 'src/app/services/auth-service';

export interface DialogData {
  name: string;
  description: string;
}

@Component({
  templateUrl: 'create-role-dialog.html',
})
export class CreateRoleDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<CreateRoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private snackBar: MatSnackBar,
    private authService: AuthService) { }

  ok() {
    this.authService.roles.create(this.data.name, this.data.description).subscribe(res => {
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
