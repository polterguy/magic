
import { Component, OnInit } from '@angular/core';
import { AuthenticateService } from './services/authenticate-service';
import { MatSnackBar } from '@angular/material';
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private username: string;
  private password: string;
  private jwtHelper: JwtHelperService;

  constructor(
    private authService: AuthenticateService,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.validateToken();
  }

  isLoggedIn() {
    const token = localStorage.getItem('access_token');
    return token !== null && token !== undefined;
  }

  logout() {
    localStorage.removeItem('access_token');
  }

  login() {
    this.authService.authenticate(this.username, this.password).subscribe((res) => {
      localStorage.setItem('access_token', res.ticket);
      this.username = '';
      this.password = '';
    }, (error) => {
      this.showError(error.error.message);
    });
  }

  showError(error: string) {
    this.snackBar.open(error, null, {
      duration: 2000,
      panelClass: ['error-snackbar'],
    });
  }

  public validateToken() {
    interval(1000).pipe(
      map(() => {
        const isExpired = this.jwtHelper.isTokenExpired(
          localStorage.getItem('access_token'),
        );
        if (isExpired) {
          this.logout();
        }
      }),
    );
  }
}
