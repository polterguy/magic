
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CrudifyService {

  constructor(private httpClient: HttpClient) { }

  public getDatabases() {
    return this.httpClient.get<any[]>(environment.apiURL + 'hl/system/db/databases');
  }

  public getTables(database: string) {
    return this.httpClient.get<any[]>(
      environment.apiURL + 
      'hl/system/db/tables?database=' + encodeURI(database));
  }

  public getColumns(database: string, table: string) {
    return this.httpClient.get<any[]>(
      environment.apiURL + 
      'hl/system/db/columns?database=' + encodeURI(database) +
      '&table=' + encodeURI(table));
  }

  public generateCrudEndpoints(
    databaseType: string,
    connection: string,
    database: string,
    table: string,
    template: string,
    verb: string,
    args: any,
    ids: any,
    ) {
    return this.httpClient.post<any[]>(
      environment.apiURL + 'hl/system/db/generate',{
        'database-type': databaseType,
        connection,
        database,
        table,
        template,
        verb,
        'arguments': args,
        ids,
      });
  }
}
