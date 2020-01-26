
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { CrudifyModel } from '../models/crudify-model';
import { CustomSQLModel } from '../models/custom-sql-model';
import { CrudifyResult } from '../models/endpoint-result-model';
import { Column } from '../models/column';

@Injectable({
  providedIn: 'root'
})
export class CrudifyService {

  constructor(private httpClient: HttpClient) { }

  public getDatabases(databaseType: string) {
    return this.httpClient.get<any[]>(
      environment.apiURL +
      'magic/modules/system/crudifier/databases?databaseType=' +
      encodeURIComponent(databaseType));
  }

  public getTables(databaseType: string, database: string) {
    return this.httpClient.get<any[]>(
      environment.apiURL +
      'magic/modules/system/crudifier/tables?databaseType=' + encodeURIComponent(databaseType) +
      '&database=' + encodeURIComponent(database));
  }

  public getColumns(databaseType: string, database: string, table: string) {
    return this.httpClient.get<Column[]>(
      environment.apiURL +
      'magic/modules/system/crudifier/columns?databaseType=' + encodeURIComponent(databaseType) +
      '&database=' + encodeURIComponent(database) +
      '&table=' + encodeURIComponent(table));
  }

  public generateCrudEndpoints(databaseType: string, model: CrudifyModel) {
    return this.httpClient.post<CrudifyResult>(
      environment.apiURL + 'magic/modules/system/crudifier/crudify', model);
  }

  public createCustomSqlEndpoint(model: CustomSQLModel) {
    return this.httpClient.post<CrudifyResult>(
      environment.apiURL + 'magic/modules/system/crudifier/custom-sql', model);
  }

  public getInputReactors() {
    return this.httpClient.get<any>(environment.apiURL + 'magic/modules/system/crudifier/input-reactors');
  }
}
