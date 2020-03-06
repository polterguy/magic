// Angular imports.
import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JwtHelperService } from '@auth0/angular-jwt';

// Services your app depends upon.
import { HttpService } from './services/http-service';
import { LoaderService } from './services/loader-service';

/*
 * Your actual component.
 *
 * Notice, this is your app's main "wire frame", and supplies you with
 * a login form, a navigation menu, in addition to some other helper functions,
 * such as automatically refreshing your JWT token before it expires, etc.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  // Databound towards login form parts of component.
  private username: string;
  private password: string;

  // Databound towards your side navigation. If true, it implies the navbar menu is expanded.
  private sidenavOpened = false;

  /*
   * Smaller optimisation to make it easier to check which roles currently logged in
   * user belongs to. Notice, this is needed to figure out which navbar items we want
   * to show, and which we want to hide.
   */
  private roles: string [] = [];

  // Constructor taking a bunch of services ++ through dependency injection.
  constructor(
    private httpService: HttpService,
    private jwtHelper: JwtHelperService,
    private snackBar: MatSnackBar,
    private loaderService: LoaderService) {

      // Checking if user is logged in, at which point we initialize the roles property.
      const token = localStorage.getItem('jwt_token');
      if (token !== null && token !== undefined) {

        // Yup! User is logged in!
        this.roles = this.jwtHelper.decodeToken(token).role.split(',');
      }
  }

  // Returns true if user is logged in, with a valid token, that's not expired.
  isLoggedIn() {
    const token = localStorage.getItem('jwt_token');
    return token !== null && token !== undefined && !this.jwtHelper.isTokenExpired(token);
  }

  // Logs the user out, and removes the token from local storage.
  logout() {
    this.roles = [];
    localStorage.removeItem('jwt_token');
  }

  // Attempts to login user, using the username/password combination he provided in the login form.
  login() {
    this.httpService.authenticate(this.username, this.password).subscribe(res => {

      // Success! User is authenticated.
      localStorage.setItem('jwt_token', res.ticket);
      this.username = '';
      this.password = '';
      this.roles = this.jwtHelper.decodeToken(res.ticket).role.split(',');

      // Refreshing JWT token every 5 minute.
      setTimeout(() => this.tryRefreshTicket(), 300000);
    }, (error: any) => {

      // Oops, authentication error, or something similar.
      console.error(error);
      this.snackBar.open(error.error.message, 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
    });
  }

  // Invoked before JWT token expires. Tries to "refresh" the JWT token, by invoking backend method.
  tryRefreshTicket() {

    // Verifying user hasn't logged out since timer was created.
    if (this.isLoggedIn()) {

      // Invokes refresh backend method.
      this.httpService.refreshTicket().subscribe(res => {

        // Success, updating JWT token, and invoking "self" 5 minutes from now.
        localStorage.setItem('jwt_token', res.ticket);
        setTimeout(() => this.tryRefreshTicket(), 300000);

      }, error => {

        // Oops, some sort of error.
        console.error(error);
        this.snackBar.open(error, 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });

        // Invoking "self" 5 minutes from now.
        setTimeout(() => this.tryRefreshTicket(), 300000);
      });
    }
  }

  // Invoked when side navigation menu should be showed.
  openSideNavigation() {
    this.sidenavOpened = true;
  }

  // Invoked when side navigation menu should be hidden.
  closeNavigator() {
    this.sidenavOpened = false;
  }

  // Returns true if user belongs to (at least) one of the specified role names.
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
