
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { TicketService } from './ticket-service';

@Injectable({
  providedIn: 'root'
})
export class PingService {

  constructor(
    private httpClient: HttpClient,
    private ticketService: TicketService) { }

  public ping() {
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/ping');
  }

  public version() {
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/version');
  }
}
