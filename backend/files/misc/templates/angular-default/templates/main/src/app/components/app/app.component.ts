// Angular imports.
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JwtHelperService } from '@auth0/angular-jwt';
import { MatDialog } from '@angular/material';
import { Subscription } from 'rxjs';

// Custom services and models your app depends upon.
import { MessageService, Message, Messages } from 'src/app/services/message-service';
import { AuthService } from '../../services/auth-service';
import { Endpoint } from '../../services/models/endpoint';
import { AuthenticateToken } from '../../services/models/authenticate-token';
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
export class AppComponent implements OnInit, OnDestroy {

  private endpoints: Endpoint[] = [];
  private subscription: Subscription;
  public sidenavOpened = false;
  public roles: string [] = [];

  /**
   * Constructs our instance
   * 
   * @param messages Message service to use pub/sub to allow for cross component communication
   * @param authService Authorization/authentication service to use
   * @param jwtHelper Helps us extract the JWT token
   * @param snackBar Used to display information and errors to user
   * @param loaderService Helps us display an Ajax load icon as we're retrieving data from the server
   * @param dialog Used to display a modal dialogue to allow user to login
   */
  constructor(
    private messages: MessageService,
    private authService: AuthService,
    private jwtHelper: JwtHelperService,
    private snackBar: MatSnackBar,
    public loaderService: LoaderService,
    private dialog: MatDialog) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    /*
     * Checking if user is logged in, at which point we set the
     * roles current user belongs to, and also creates a timer
     * that will try to refresh our JWT token after some period
     * of time.
     */
    const token = localStorage.getItem('jwt_token');
    if (token) {
      if (this.jwtHelper.isTokenExpired(token)) {
        localStorage.removeItem('jwt_token');
      } else {
        this.roles = this.jwtHelper.decodeToken(token).role.split(',');
        setTimeout(() => this.tryRefreshTicket(), 300000);
      }
    }

    /*
     * Retrieves all endpoints in system, with their associated URLs,
     * verbs, and authorization settings - As in which roles are allowed
     * to invoke which endpoints.
     */
    this.authService.endpoints().subscribe((res: Endpoint[]) => {
      this.endpoints = res;
    });

    /*
     * Creating our subscription, which once asked for stuff, will
     * return it back to the whomever is requesting it.
     */
    this.subscription = this.messages.subscriber().subscribe((msg: Message) => {
      switch (msg.name) {

        case Messages.GET_ENDPOINTS:
          msg.content = this.endpoints;
          break;

        case Messages.GET_ROLES:
          msg.content = this.roles;
          break;
      }
    });
  }

  /**
   * Implementation of OnDestroy.
   */
  public ngOnDestroy() {
    this.subscription.unsubscribe();
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
    this.messages.sendMessage({
      name: Messages.LOGGED_OUT,
    });
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
        this.authService.authenticate(authModel.username, authModel.password).subscribe((res: AuthenticateToken) => {
          localStorage.setItem('jwt_token', res.ticket);
          this.roles = this.jwtHelper.decodeToken(res.ticket).role.split(',');
          this.messages.sendMessage({
            name: Messages.LOGGED_IN,
          });
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
      this.authService.refreshTicket().subscribe((res: AuthenticateToken) => {
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
  public inRole(roles: string[]) {
    if (!roles || roles.length === 0) {
      return true;
    }
    for (const idx of roles) {
      if (this.roles.indexOf(idx) !== -1) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns true if the client can invoke the specified endpoint,
   * with the specified verb.
   * 
   * @param url Endpoint's URL
   * @param verb HTTP verb
   */
  public canInvoke(url: string, verb: string) {
    if (this.endpoints.length === 0) {
      return false;
    }
    const endpoints = this.endpoints.filter(x => x.path === url && x.verb === verb);
    if (endpoints.length > 0) {
      const endpoint = endpoints[0];
      return endpoint.auth === null ||
        endpoint.auth.filter(x => this.roles.includes(x)).length > 0;
    }
    return false;
  }
}
