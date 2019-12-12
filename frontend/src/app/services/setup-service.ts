
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SetupService {

  constructor(private httpClient: HttpClient) { }

  checkDatabaseConfiguration(databaseType: string) {
    return this.httpClient.get<any>(
      environment.apiURL +
      'magic/modules/system/setup/verify-database-connection?databaseType=' +
      encodeURIComponent(databaseType));
  }

  getAppSettingsJson() {
    return this.httpClient.get<string>(environment.apiURL + 'magic/modules/system/setup/load-config-file');
  }

  saveAppSettingsJson(fileContent: string) {
    return this.httpClient.post<string>(
      environment.apiURL +
      'magic/modules/system/setup/save-config-file', {
        content: fileContent
      });
  }

  setupAuthentication(databaseType: string, rootUsername: string, rootPassword: string) {
    return this.httpClient.post<any>(
      environment.apiURL +
      'magic/modules/system/setup/setup-auth', {
        databaseType,
        rootUsername,
        rootPassword,
      });
  }
}
