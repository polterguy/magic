
import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JwtHelperService } from '@auth0/angular-jwt';

import { HttpService } from './services/http-service';
import { LoaderService } from './services/loader-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  private username: string;
  private password: string;
  private sidenavOpened: boolean = false;
  private roles: string [] = [];

  constructor(
    private httpService: HttpService,
    private jwtHelper: JwtHelperService,
    private snackBar: MatSnackBar,
    private loaderService: LoaderService) {
      const token = localStorage.getItem('jwt_token');
      if (token !== null && token !== undefined) {
        this.roles = this.jwtHelper
          .decodeToken(token).role.split(',');
      }
  }

  isLoggedIn() {
    const token = localStorage.getItem('jwt_token');
    return token !== null && token !== undefined && !this.jwtHelper.isTokenExpired(token);
  }

  logout() {
    this.roles = [];
    localStorage.removeItem('jwt_token');
  }

  login() {
    this.httpService.authenticate(this.username, this.password).subscribe(res => {
      localStorage.setItem('jwt_token', res.ticket);
      this.username = '';
      this.password = '';
      this.roles = this.jwtHelper.decodeToken(res.ticket).role.split(',');

      // Refreshing JWT token every 5 minute.
      setTimeout(() => this.tryRefreshTicket(), 300000);
    }, (error: any) => {
      this.snackBar.open(error, 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      console.log(error);
    });
  }

  tryRefreshTicket() {
    if (this.isLoggedIn()) {
      this.httpService.refreshTicket().subscribe(res => {
        localStorage.setItem('jwt_token', res.ticket);
        setTimeout(() => this.tryRefreshTicket(), 300000);
      }, error => {
        this.snackBar.open(error, 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        console.log(error);
        setTimeout(() => this.tryRefreshTicket(), 300000);
      });
    }
  }

  openSideNavigation() {
    this.sidenavOpened = true;
  }

  closeNavigator() {
    this.sidenavOpened = false;
  }

  inRole(roles: string[]) {
    for (let idx = 0; idx < roles.length; idx++) {
      if (this.roles.indexOf(roles[idx]) !== -1) {
        return true;
      }
    }
    return false;
  }
}
