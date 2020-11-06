import { AuthService } from 'src/app/services/auth-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Component } from '@angular/core';
import { StatusResponse } from '../../services/models/status-response';

/**
 * Profile component, allowing a user to edit his profile, change his password,
 * etc.
 */
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {

  /*
   * New password, and the repeat value, that must be the same for user
   * to be allowed to change his password
   */
  public password = '';
  public passwordRepeat = '';

  /**
   * Constructor creating our component.
   * 
   * @param snackBar Snackbar used to display errors to the user
   * @param jwtHelper Helper service for parsing JWT tokens
   * @param authService Service used to invoke backend to update password, etc
   */
  constructor(
    private snackBar: MatSnackBar,
    public authService: AuthService)
  { }

  /**
   * Saves the user's new password.
   */
  public saveNewPassword() {

    // Making sure password is typed the exact same twice.
    if (this.password !== this.passwordRepeat || this.password === '') {
      this.snackBar.open('Passwords must match and be an actual password', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    // Invoking backend changing the user's password.
    this.authService.me.changePassword(this.password).subscribe((res: StatusResponse) => {
      this.snackBar.open('Your password was successfully changed', 'Close', {
        duration: 2000,
      });
    }, (error: any) => {
      this.snackBar.open(error.error.message, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }
}
