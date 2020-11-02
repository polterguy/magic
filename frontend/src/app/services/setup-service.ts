
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  setup(
    databaseType: string,
    authDatabase: string,
    rootUsername: string,
    rootPassword: string) {
    return this.httpClient.post<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/setup/setup', {
        databaseType,
        authDatabase,
        rootUsername,
        rootPassword,
        scheduler: true,
      });
  }

  getPublicKey() {
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() + 
      'magic/modules/system/crypto/public-key'
    );
  }

  generateKeyPair(seed: string, strength: number) {
    return this.httpClient.post<any>(
      this.ticketService.getBackendUrl() + 
      'magic/modules/system/crypto/generate-keypair', {
        seed,
        strength
      }
    );
  }
}
