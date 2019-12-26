
import { Component } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';

import { HttpService } from './http-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private username: string;
  private password: string;

  constructor(
    private httpService: HttpService,
    private jwtHelper: JwtHelperService,
    private router: Router) {}

  isLoggedIn() {
    const token = localStorage.getItem('access_token');
    return token !== null && token !== undefined && !this.jwtHelper.isTokenExpired(token);
  }

  logout() {
    localStorage.removeItem('access_token');
    this.router.navigate(['']);
  }

  login() {
    this.httpService.authenticate(this.username, this.password).subscribe(res => {
      localStorage.setItem('access_token', res.ticket);
      this.username = '';
      this.password = '';
    }, error => {
      console.log(error);
    });
  }
}
