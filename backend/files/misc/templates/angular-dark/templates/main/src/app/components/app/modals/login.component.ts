import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export class AuthModel {
  username: string;
  password: string;
}

/**
 * Your app's login component.
 *
 * This is the modal window that encapsulates your login form
 */
@Component({
  templateUrl: './login.component.html'
})
export class LoginComponent {

  public username: string;
  public password: string;

  public constructor(
    private dialogRef: MatDialogRef<LoginComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AuthModel)
  { }

  /**
   * Invoked when the login button is clicked.
   */
  public login() {
    this.dialogRef.close({
      username: this.username,
      password: this.password
    });
  }

  /**
   * Invoked when the cancel button is clicked.
   */
  public close() {
    this.dialogRef.close();
  }
}
