import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AuthService } from 'src/app/services/auth-service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {

  public password = '';
  public passwordRepeat = '';

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

  save() {
    if (this.password !== this.passwordRepeat || this.password === '') {
      this.snackBar.open('Passwords must match and be an actual password', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
      return;
    }
    this.authService.changeMyPassword(this.password).subscribe(res => {
      this.snackBar.open('Your password was successfully changed', 'Close', {
        duration: 2000,
      });
    }, error => {
      this.snackBar.open(error.error.message, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }
}
