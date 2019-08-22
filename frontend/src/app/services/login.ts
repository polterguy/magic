
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable()
export class ConfigService {
  loginUrl = environment.baseURL + 'login';

  constructor(private http: HttpClient) { }

  login(username: string, password: string) {
    return this.http.post(this.loginUrl, {
      username: username,
      password: password
    });
  }
}