
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { TicketService } from './ticket-service';

@Injectable({
  providedIn: 'root'
})
export class SetupService {

  constructor(
    private httpClient: HttpClient,
    private ticketService: TicketService) { }

  getAppSettingsJson() {
    return this.httpClient.get<string>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/setup/load-config-file');
  }

  saveAppSettingsJson(config: any) {
    return this.httpClient.post<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/setup/save-config-file', config);
  }

  setupAuthentication(databaseType: string, rootUsername: string, rootPassword: string) {
    return this.httpClient.post<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/setup/setup-auth', {
        databaseType,
        rootUsername,
        rootPassword,
      });
  }
}
