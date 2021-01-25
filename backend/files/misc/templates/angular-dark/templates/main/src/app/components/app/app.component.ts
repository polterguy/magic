// Angular imports.
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// Custom services and models your app depends upon.
import { AuthService } from '../../services/auth-service';
import { LoginComponent } from './modals/login.component';
import { LoaderService } from '../../services/loader-service';
import { MessageService, Messages } from 'src/app/services/message-service';
import { AuthenticateToken } from '../../services/models/authenticate-token';

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

  /**
   * Constructs our instance
   * 
   * @param messages Message service to use pub/sub to allow for cross component communication
   * @param authService Authorization/authentication service to use
   * @param snackBar Used to display information and errors to user
   * @param loaderService Helps us display an Ajax load icon as we're retrieving data from the server
   * @param dialog Used to display a modal dialogue to allow user to login
   */
  constructor(
    private messages: MessageService,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    public loaderService: LoaderService,
    private dialog: MatDialog) { }

  /**
   * Attempts to login user, using the username/password combination he
   * provided in the login form.
   */
  public login() {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '500px',
    });
    dialogRef.afterClosed().subscribe((res: any) => {
      if (res) {
        this.authService.me.authenticate(res.username, res.password).subscribe((res: AuthenticateToken) => {

          // Success, notifying listeners that we've authenticated.
          this.messages.sendMessage({
            name: Messages.LOGGED_IN,
          });
        }, (error: any) => {

          // Error.
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
   * Logs current user out of system.
   */
  public logout() {

    // Logging out user, and notifying subscribers that we've logged out the user.
    this.authService.me.logout()
    this.messages.sendMessage({
      name: Messages.LOGGED_OUT,
    });
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
   * Invoked when side navigation menu should be toggled.
   */
  public toggleNavbar() {
    this.sidenavOpened = !this.sidenavOpened;
  }
}
