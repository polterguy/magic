
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TicketService } from './ticket-service';

@Injectable({
  providedIn: 'root'
})
export class SqlService {

  constructor(
    private httpClient: HttpClient,
    private ticketService: TicketService) { }

  public evaluate(
    sql: string,
    databaseType: string,
    database: string = null,
    safeMode: boolean = true) {
    return this.httpClient.post<any[]>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/sql/evaluate', {
        databaseType: databaseType === 'mssql-batch' ? 'mssql' : databaseType,
        sql,
        database,
        batch: databaseType === 'mssql-batch' ? true : false,
        safeMode,
      });
  }

  public getSavedFiles(databaseType: string) {
    return this.httpClient.get<string[]>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/sql/list-files?databaseType=' + encodeURIComponent(databaseType));
  }

  public getDatabases(databaseType: string) {
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/sql/databases?databaseType=' + encodeURIComponent(databaseType));
  }

  public saveFile(databaseType: string, filename: string, content: string) {
    return this.httpClient.put<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/sql/save-file', {
        databaseType,
        filename,
        content
      });
  }
}
