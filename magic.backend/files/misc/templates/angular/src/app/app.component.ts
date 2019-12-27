
import { Component } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

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
    private jwtHelper: JwtHelperService) {
  }

  isLoggedIn() {
    const token = localStorage.getItem('jwt_token');
    return token !== null && token !== undefined && !this.jwtHelper.isTokenExpired(token);
  }

  logout() {
    localStorage.removeItem('jwt_token');
  }

  login() {
    this.httpService.authenticate(this.username, this.password).subscribe(res => {
      localStorage.setItem('jwt_token', res.ticket);
      this.username = '';
      this.password = '';
    }, (error: any) => {
      console.log(error);
    });
  }
}
