
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from './http.service';
import { Crudify } from '../models/crudify.model';
import { Database } from '../models/database.model';
import { LocResult } from '../models/loc-result.model';

/**
 * Crudify service, allows you to crudify your databases.
 */
@Injectable({
  providedIn: 'root'
})
export class CrudifyService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpService HTTP service to use for backend invocations
   */
  constructor(private httpService: HttpService) { }

  /**
   * Returns all databases from backend from your specified database type,
   * that can be e.g. mysql or mssql.
   * 
   * @param databaseType Database type to return tables from
   */
  public getDatabases(databaseType: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<Database[]>(
      '/magic/modules/system/crudifier/databases?databaseType=' + encodeURIComponent(databaseType));
  }

  /**
   * Returns all tables from specified database.
   * 
   * @param database Database to return tables from
   */
  public getTables(database: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<any[]>('/magic/modules/system/crudifier/tables');
  }

  /**
   * Returns all columns from specified table in specified database.
   * 
   * @param database Database to return columns from
   * @param table Table to return columns from
   */
  public getColumns(database: string, table: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<any[]>('/magic/modules/system/crudifier/columns');
  }

  /**
   * Returns all available input reactors from backend.
   */
  public getInputReactor() {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<any[]>('/magic/modules/system/crudifier/input-reactors');
  }

  /**
   * Crudifies a database table for a specified HTTP verb.
   * 
   * @param data Input for process
   */
  public crudify(data: Crudify) {

    // Invoking backend and returning observable to caller.
    return this.httpService.post<LocResult>('/magic/modules/system/crudifier/crudify', data);
  }

  /**
   * Generates an SQL endpoint for a specified HTTP verb.
   * 
   * @param data Input for process
   */
  public generateSqlEndpoint(data: any) {

    // Invoking backend and returning observable to caller.
    return this.httpService.post<Response>('/magic/modules/system/crudifier/custom-sql', data);
  }
}
