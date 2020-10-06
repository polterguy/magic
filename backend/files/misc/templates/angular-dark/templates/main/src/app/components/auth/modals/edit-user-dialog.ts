import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar, MatSelectChange } from '@angular/material';
import { AuthService } from 'src/app/services/auth-service';
import { Component, Inject, OnInit } from '@angular/core';

/**
 * Username dialogue data model, for which user to edit.
 */
export interface DialogData {
  username: string;
}

/**
 * Edit user dialogue component, that allows an administrator in the system
 * to edit the roles that a user belongs to.
 */
@Component({
  templateUrl: 'edit-user-dialog.html',
  styleUrls: ['edit-user-dialog.scss']
})
export class EditUserDialogComponent implements OnInit {

  // Contains roles the user belongs to.
  public userRoles: any[] = null;

  // Contains all roles in the system.
  public allRoles: any[] = null;

  // Contains the currently selected role, the user wants to add to the specified user.
  public selectedValue: any = null;

  constructor(
    public dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private snackBar: MatSnackBar,
    private authService: AuthService) { }

  ngOnInit() {

    // Retrieves user's roles, as in the roles the currently edited user belongs to.
    this.getUserRoles();

    // Retrieves ALL roles in the system, such that user can choose new role to add edited user to.
    this.authService.roles.read({
      limit: 1000,
      offset: 0,
    }).subscribe(res => {
      this.allRoles = res;
    }, (error: any) => {
      this.snackBar.open(error.error.message, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }

  getUserRoles() {
    this.authService.users.roles(this.data.username).subscribe(res => {
      this.userRoles = res || [];
    }, (error: any) => {
      this.snackBar.open(error.error.message, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }

  addRole(e: MatSelectChange) {
    this.authService.users.addRole(this.data.username, e.value.name).subscribe((res: any) => {
      this.snackBar.open('Role added to user', 'Close', {
        duration: 2000,
      });
      this.selectedValue = undefined;
      this.getUserRoles();
    }, (error: any) => {
      this.snackBar.open(error.error.message, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
      this.selectedValue = undefined;
    });
  }

  deleteRoleFromUser(role: string) {
    this.authService.users.deleteRole(this.data.username, role).subscribe(res => {
      this.snackBar.open('Role removed from user', 'Close', {
        duration: 2000,
      });
      this.getUserRoles();
    }, (error: any) => {
      this.snackBar.open(error.error.message, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }
  
  close() {
    this.dialogRef.close();
  }
}
