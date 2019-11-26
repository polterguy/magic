
import { Component, OnInit } from '@angular/core';
import { AuthenticateService } from './services/authenticate-service';
import { MatSnackBar } from '@angular/material';
import { interval } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from 'src/environments/environment';

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
    private jwtHelper: JwtHelperService) { }

  ngOnInit() {
    this.validateToken();
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
    }, (error) => {
      this.showError(error.error.message);
    });
  }

  showError(error: string) {
    this.snackBar.open(error, null, {
      duration: 5000,
      panelClass: ['error-snackbar'],
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
      let now = new Date();
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
}
