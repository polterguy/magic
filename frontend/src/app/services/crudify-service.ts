
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CrudifyService {

  constructor(private httpClient: HttpClient) { }

  public getDatabases() {
    return this.httpClient.get<any[]>(environment.apiURL + 'hl/system/databases-list');
  }

  public getTables(database: string) {
    return this.httpClient.get<any[]>(
      environment.apiURL + 
      'hl/system/tables-list?database=' + encodeURI(database));
  }
}
