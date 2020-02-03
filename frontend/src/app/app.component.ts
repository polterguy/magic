
import { Component, OnInit } from '@angular/core';
import { AuthenticateService } from './services/authenticate-service';
import { MatSnackBar } from '@angular/material';
import { interval } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from 'src/environments/environment';
import { PingService } from './services/ping-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  private username = '';
  private password = '';
  private backendUrl = environment.apiURL;
  private connectedToBackend = false;

  constructor(
    private authService: AuthenticateService,
    private snackBar: MatSnackBar,
    private jwtHelper: JwtHelperService,
    private pingService: PingService,
    private router: Router) { }

  ngOnInit() {
    this.periodicallyValidateJwtToken();
    this.ping();
    if (!this.isLoggedIn() && this.router.url !== '') {
      this.router.navigate(['']);
    }
  }

  backendUrlChanged() {
    // Need to verify the new URL is a valid magic.backend.
    environment.apiURL = this.backendUrl;
    this.ping();
  }

  // Verifies that the user is connected to a magic backend.
  ping() {
    this.pingService.ping().subscribe(res => {
      if (res.result === 'success') {
        console.log('Successfully connected to backend');
        this.connectedToBackend = true;
      } else {
        this.connectedToBackend = false;
      }
    }, err => {
      this.connectedToBackend = false;
      this.showError('Not connected to backend. Make sure you start your Magic backend, ' +
        'or change the backend URL to an actual Magic installation');
    });
  }

  // Returns true if client is authenticated.
  isLoggedIn() {
    const token = localStorage.getItem('access_token');
    return token !== null && token !== undefined && !this.jwtHelper.isTokenExpired(token);
  }

  // Logs out the user.
  logout() {
    localStorage.removeItem('access_token');
    this.router.navigate(['']);
  }

  // Logs in user with username/password combination from HTML page.
  login() {
    environment.apiURL = this.backendUrl;
    environment.hasBeenSetup = this.password !== 'root';
    this.authService.authenticate(this.username, this.password).subscribe(res => {
      localStorage.setItem('access_token', res.ticket);
      if (this.password === 'root') {
        this.router.navigate(['/setup']);
      }
      this.username = '';
      this.password = '';
    }, (error) => {
      this.showError(error.error.message);
    });
  }

  setupDone() {
    return environment.hasBeenSetup;
  }

  /*
   * Creates a timeout that executes every 10 seconds, that simply ensure the JWT token
   * is valid - And if not, removes it from local storage, and logs out the user.
   */
  public periodicallyValidateJwtToken() {

    // Makes sure we check token every 10 seconds.
    interval(10000).subscribe(x => {

      // Checking if token exists or is expired, and if so, logs out user.
      const token = localStorage.getItem('access_token');
      if (token == null || this.jwtHelper.isTokenExpired(token)) {
        this.logout();
        return;
      }

      /*
       * Retrieves token's expiration datetime, to make sure we "refresh"
       * the token 2 minutes before it expires.
       */
      const expiration = this.jwtHelper.getTokenExpirationDate(token);
      const now = new Date();
      now.setSeconds(now.getSeconds() + 120);
      if (now > expiration) {

        // Refreshing JWT token.
        this.authService.refreshTicket().subscribe((res) => {
          localStorage.setItem('access_token', res.ticket);
        }, (error) => {
          this.showError(error.error.message);
        });
      }
    });
  }

  showError(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }

  showWarning(warning: string) {
    this.snackBar.open(warning, 'Close', {
      duration: 10000,
      panelClass: ['warning-system-snackbar'],
    });
  }
}
