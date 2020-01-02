/*
 * Magic, Copyright(c) Thomas Hansen 2019, thomas@servergardens.com, all rights reserved.
 * See the enclosed LICENSE file for details.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar, MatSelectChange } from '@angular/material';
import { AuthService } from 'src/app/services/auth-service';

export interface DialogData {
  username: string;
}

@Component({
  templateUrl: 'edit-user-dialog.html',
  styleUrls: ['edit-user-dialog.scss']
})
export class EditUserDialogComponent implements OnInit {

  private userRoles: any[] = null;
  private allRoles: any[] = null;
  private selectedValue: any = null;

  constructor(
    public dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private snackBar: MatSnackBar,
    private authService: AuthService) { }

  ngOnInit() {
    this.getUserRoles();
    this.authService.getRoles({
      limit: 1000,
      offset: 0,
    }).subscribe(res => {
      this.allRoles = res;
    }, error => {
      this.snackBar.open(error.error.message, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }

  getUserRoles() {
    this.authService.getUserRoles(this.data.username).subscribe(res => {
      this.userRoles = res || [];
    }, error => {
      this.snackBar.open(error.error.message, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }

  addRole(e: MatSelectChange) {
    this.authService.addRoleToUser(this.data.username, e.value.name).subscribe(res => {
      this.snackBar.open('Role added to user', 'Close', {
        duration: 2000,
      });
      this.selectedValue = undefined;
      this.getUserRoles();
    }, error => {
      this.snackBar.open(error.error.message, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
      this.selectedValue = undefined;
    });
  }

  deleteRoleFromUser(role: string) {
    this.authService.deleteRoleFromUser(this.data.username, role).subscribe(res => {
      this.snackBar.open('Role removed from user', 'Close', {
        duration: 2000,
      });
      this.getUserRoles();
    }, error => {
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
