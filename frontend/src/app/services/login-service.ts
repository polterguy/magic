
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  loginUrl = environment.baseURL + 'login';

  constructor(private http: HttpClient) { }

  login(username: string, password: string) {

    return this.http.post(this.loginUrl, {
      username,
      password
    });
  }
}
