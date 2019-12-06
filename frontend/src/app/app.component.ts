
import { Component, OnInit } from '@angular/core';
import { AuthenticateService } from './services/authenticate-service';
import { MatSnackBar } from '@angular/material';
import { interval } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from 'src/environments/environment';
import { PingService } from './services/ping-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private username: string;
  private password: string;
  private backendUrl = environment.apiURL;

  constructor(
    private authService: AuthenticateService,
    private snackBar: MatSnackBar,
    private jwtHelper: JwtHelperService,
    private pingService: PingService) { }

  ngOnInit() {
    this.validateToken();
    this.ping();
  }

  showMenu() {
    return this.isLoggedIn() && environment.defaultAuth === false;
  }

  ping() {
    this.pingService.ping().subscribe(res => {
      environment.version = res.version;
      if (res.warnings !== undefined) {
        for (const idx of Object.keys(res.warnings)) {
          if (idx === 'defaultAuth') {
            // The default authentication slot has not been overridden.
            environment.defaultAuth = true;
          }
          console.warn(res.warnings[idx]);
        }
      }
      if (environment.defaultAuth) {
        this.showWarning('The default [magic.authenticate] slot has not been overridden, ' +
          'please secure your system by going through the "Setup" wizard.');
      }
    });
  }

  isLoggedIn() {
    const token = localStorage.getItem('access_token');
    return token !== null && token !== undefined && !this.jwtHelper.isTokenExpired(token);
  }

  logout() {
    localStorage.removeItem('access_token');
  }

  login() {
    environment.apiURL = this.backendUrl;
    this.authService.authenticate(this.username, this.password).subscribe(res => {
      localStorage.setItem('access_token', res.ticket);
      this.username = '';
      this.password = '';
      this.ping();
    }, (error) => {
      this.showError(error.error.message);
    });
  }

  // This method makes sure JWT ticket is refreshed automatically before it expires
  public validateToken() {
    interval(10000).subscribe(x => {

      // Checking if token is about to expire, or if it has already expired
      const token = localStorage.getItem('access_token');
      if (token == null || this.jwtHelper.isTokenExpired(token)) {
        this.logout();
        return;
      }
      const expiration = this.jwtHelper.getTokenExpirationDate(token);
      const now = new Date();
      now.setSeconds(now.getSeconds() + 120);
      if (now > expiration) {

        // Refreshing JWT token
        this.authService.refreshTicket().subscribe((res) => {
          localStorage.setItem('access_token', res.ticket);
        }, (error) => {
          this.showError(error.error.message);
        });
      }
    });
  }

  showError(error: string) {
    this.snackBar.open(error, null, {
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
