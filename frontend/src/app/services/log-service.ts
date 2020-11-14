
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

  public listLogItems(filter: string, offset: number, limit: number) {
    let query = '';
    if (filter) {
      query += '&query=' + encodeURIComponent(filter);
    }
    return this.httpClient.get<LogItem[]>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/logging/log-items?offset=' +
      offset +
      '&limit=' +
      limit + 
      query);
  }

  public countLogItems(filter?: string) {
    let query = '';
    if (filter) {
      query += '?query=' + encodeURIComponent(filter);
    }
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/logging/count-items' +
      query);
  }

  public countErrorItems() {
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/logging/count-error-items');
  }

  public deleteAll() {
    return this.httpClient.delete<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/logging/delete-all');
  }

  public statistics() {
    return this.httpClient.get<any[]>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/logging/log-statistics');
  }

  public statisticsDays() {
    return this.httpClient.get<any[]>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/logging/log-statistics-days');
  }

  public createLocLogItem(loc: number, type: string, name: string) {
    return this.httpClient.post<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/logging/log-loc', {
        loc,
        type,
        name,
      });
  }

  public getLocLog() {
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/logging/loc-generated');
  }
}
