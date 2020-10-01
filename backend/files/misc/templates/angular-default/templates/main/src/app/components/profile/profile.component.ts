import { AuthService } from 'src/app/services/auth-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Component } from '@angular/core';

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
    private jwtHelper: JwtHelperService,
    private authService: AuthService)
  { }

  /**
   * Returns true if user is logged in, with a valid token,
   * that is not expired.
   */
  public isLoggedIn() {
    const token = localStorage.getItem('jwt_token');
    return token && !this.jwtHelper.isTokenExpired(token);
  }

  /**
   * Saves the user's new password.
   */
  public save() {

    // Making sure password is typed the exact same twice.
    if (this.password !== this.passwordRepeat || this.password === '') {
      this.snackBar.open('Passwords must match and be an actual password', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    // Invoking backend changing the user's password.
    this.authService.changeMyPassword(this.password).subscribe(res => {
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
