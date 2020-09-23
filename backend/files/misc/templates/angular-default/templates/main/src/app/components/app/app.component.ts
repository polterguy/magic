// Angular imports.
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JwtHelperService } from '@auth0/angular-jwt';

// Services your app depends upon.
import { HttpService } from '../../services/http-service';
import { LoaderService } from '../../services/loader-service';
import { LoginComponent } from './modals/login.component';

/**
 * Your app's main component.
 *
 * Notice, this is your app's main "wire frame", and supplies you with
 * a login form, a navigation menu, in addition to some other helper functions,
 * such as automatically refreshing your JWT token before it expires, etc.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  public sidenavOpened = false;
  public roles: string [] = [];

  constructor(
    private httpService: HttpService,
    private jwtHelper: JwtHelperService,
    private snackBar: MatSnackBar,
    public loaderService: LoaderService,
    public dialog: MatDialog) {
      const token = localStorage.getItem('jwt_token');
      if (token !== null && token !== undefined) {
        this.roles = this.jwtHelper.decodeToken(token).role.split(',');
        setTimeout(() => this.tryRefreshTicket(), 300000);
      }
  }

  /**
   * Returns true if user is logged in, with a valid token,
   * that is not expired.
   */
  public isLoggedIn() {
    const token = localStorage.getItem('jwt_token');
    return token && !this.jwtHelper.isTokenExpired(token);
  }

  /**
   * Logs the user out, and removes the token from local storage.
   */
  public logout() {
    this.roles = [];
    localStorage.removeItem('jwt_token');
    window.location.reload();
  }

  /**
   * Attempts to login user, using the username/password combination he
   * provided in the login form.
   */
  public login() {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '500px',
    });
    dialogRef.afterClosed().subscribe(authModel => {
      if (authModel) {
        this.httpService.authenticate(authModel.username, authModel.password).subscribe(res => {
          localStorage.setItem('jwt_token', res.ticket);
          this.roles = this.jwtHelper.decodeToken(res.ticket).role.split(',');
          window.location.reload();
        }, (error: any) => {
          console.error(error);
          this.snackBar.open(error.error.message, 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
        });
      }
    });
  }

  /**
   * Invoked before JWT token expires. Tries to "refresh" the JWT token,
   * by invoking backend method.
   */
  public tryRefreshTicket() {
    if (this.isLoggedIn()) {
      this.httpService.refreshTicket().subscribe(res => {
        localStorage.setItem('jwt_token', res.ticket);
        setTimeout(() => this.tryRefreshTicket(), 300000);
      }, (error: any) => {
        console.error(error);
        this.snackBar.open(error, 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        setTimeout(() => this.tryRefreshTicket(), 300000);
      });
    }
  }

  /**
   * Invoked when side navigation menu should be showed.
   */
  public openSideNavigation() {
    this.sidenavOpened = true;
  }

  /**
   * Invoked when side navigation menu should be hidden.
   */
  public closeNavigator() {
    this.sidenavOpened = false;
  }

  /**
   * Returns true if user belongs to (at least) one of the specified role names.
   * 
   * @param roles List of roles to check whether or not user belongs to one of them
   */
  inRole(roles: string[]) {
    if (roles === null || roles === undefined || roles.length === 0) {
      return true;
    }
    for (const idx of roles) {
      if (this.roles.indexOf(idx) !== -1) {
        return true;
      }
    }
    return false;
  }
}
