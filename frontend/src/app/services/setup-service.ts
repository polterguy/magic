
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
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/setup/load-config-file');
  }

  saveLicense(license: string) {
    return this.httpClient.post<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/setup/save-license', {
        license
      });
  }

  setup(
    databaseType: string,
    rootPassword: string,
    settings: string) {
    return this.httpClient.post<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/setup/setup', {
        databaseType,
        rootPassword,
        settings,
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

  getStatus() {
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() + 
      'magic/modules/system/setup/status'
    );
  }
}
