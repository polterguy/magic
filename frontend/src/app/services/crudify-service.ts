
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { CrudifyModel } from '../models/crudify-model';
import { CustomSQLModel } from '../models/custom-sql-model';
import { CrudifyResult } from '../models/endpoint-result-model';

@Injectable({
  providedIn: 'root'
})
export class CrudifyService {

  constructor(private httpClient: HttpClient) { }

  public getDatabases(databaseType: string) {
    return this.httpClient.get<any[]>(environment.apiURL + `magic/modules/${databaseType}/databases`);
  }

  public getTables(databaseType: string, database: string) {
    return this.httpClient.get<any[]>(
      environment.apiURL +
      `magic/modules/${databaseType}/tables?database=` + encodeURI(database));
  }

  public getColumns(databaseType: string, database: string, table: string) {
    return this.httpClient.get<any[]>(
      environment.apiURL +
      `magic/modules/${databaseType}/columns?database=` + encodeURI(database) +
      '&table=' + encodeURI(table));
  }

  public generateCrudEndpoints(databaseType: string, model: CrudifyModel) {
    return this.httpClient.post<CrudifyResult>(
      environment.apiURL + `magic/modules/system/crudifier/crudify`, model);
  }

  public createCustomSqlEndpoint(databaseType: string, model: CustomSQLModel) {
    return this.httpClient.post<CrudifyResult>(
      environment.apiURL + `magic/modules/${databaseType}/custom-sql`, model);
  }
}
