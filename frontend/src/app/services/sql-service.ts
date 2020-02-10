
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { TicketService } from './ticket-service';

@Injectable({
  providedIn: 'root'
})
export class SqlService {

  constructor(
    private httpClient: HttpClient,
    private ticketService: TicketService) { }

  public evaluate(sql: string, databaseType: string) {
    return this.httpClient.post<any[]>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/sql/evaluate', {
        databaseType: databaseType === 'mssql-batch' ? 'mssql' : databaseType,
        sql,
        batch: databaseType === 'mssql-batch' ? true : false,
      });
  }

  public getSavedFiles(databaseType: string) {
    return this.httpClient.get<string[]>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/sql/list-files?databaseType=' + encodeURIComponent(databaseType));
  }
}
