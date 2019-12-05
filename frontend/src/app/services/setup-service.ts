
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SetupService {

  constructor(private httpClient: HttpClient) { }

  setupAuthentication(databaseType: string, rootUsername: string, rootPassword: string) {
    return this.httpClient.post<any>(
      environment.apiURL +
      'magic/modules/system/templates/setup-auth', {
        databaseType,
        rootUsername,
        rootPassword,
      });
  }
}
