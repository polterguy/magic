
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TicketService } from './ticket-service';
import { LogItem } from '../models/log-item';

@Injectable({
  providedIn: 'root'
})
export class LogService {

  constructor(
    private httpClient: HttpClient,
    private ticketService: TicketService) { }

  public listLogItems(offset: number, limit: number) {
    return this.httpClient.get<LogItem[]>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/logging/log-items?offset=' +
      offset +
      '&limit=' + limit);
  }

  public countLogItems() {
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/logging/count-items');
  }

  public countErrorItems() {
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/logging/count-error-items');
  }
}
