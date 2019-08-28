
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { CrudifyModel, CrudifyResult } from '../models/crudify-model';

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

  public generateCrudEndpoints(model: CrudifyModel) {
    return this.httpClient.post<CrudifyResult>(
      environment.apiURL + 'hl/system/db/generate', model);
  }
}
