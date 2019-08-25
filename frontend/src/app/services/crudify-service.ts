
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CrudifyService {

  constructor(private httpClient: HttpClient) { }

  public getDatabases() {
    return this.httpClient.get<any[]>(environment.apiURL + 'hl/system/db/databases-list');
  }

  public getTables(database: string) {
    return this.httpClient.get<any[]>(
      environment.apiURL + 
      'hl/system/db/tables-list?database=' + encodeURI(database));
  }

  public getColumns(database: string, table: string) {
    return this.httpClient.get<any[]>(
      environment.apiURL + 
      'hl/system/db/columns-list?database=' + encodeURI(database) +
      '&table=' + encodeURI(table));
  }
}
