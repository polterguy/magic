
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from './http.service';
import { FileService } from './file.service';

/**
 * Setup service, allows you to setup, read, and manipulate your configuration
 * settings.
 */
@Injectable({
  providedIn: 'root'
})
export class SqlService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpService HTTP service to use for backend invocations
   * @param fileService Used to retrieve and update snippets from your backend
   */
  constructor(
    private httpService: HttpService,
    private fileService: FileService) { }

  /**
   * Executes a piece of SQL and returns its result.
   * 
   * @param databaseType Type of database, for instance 'mssql' or 'mysql'.
   * @param database Database connection string (reference to appsettings.json)
   * @param sql SQL to evaluate
   * @param safeMode If true will only return the first 1.000 records
   */
  public execute(
    databaseType: string,
    database: string,
    sql: string,
    safeMode: boolean) {

    // Invoking backend and returning observable to caller.
    return this.httpService.post<any[]>('/magic/modules/system/sql/evaluate', {
      databaseType,
      database,
      sql,
      safeMode,
    });
  }

  /**
   * Returns all connection strings configured in your backend.
   * 
   * @param databaseType Database type to retrieve connection strings for
   */
  public connectionStrings(databaseType: string) {
    return this.httpService.get<any>(
      '/magic/modules/system/sql/connection-strings?databaseType=' +
      encodeURIComponent(databaseType));
  }

  /**
   * Returns SQL vocabulary auto complete object, such as table names, field names, etc.
   * 
   * @param databaseType Type of database, for instance 'mssql' or 'mysql'.
   * @param connectionString Database connection string (reference to appsettings.json)
   */
  public vocabulary(databaseType: string, connectionString: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<any>('/magic/modules/system/sql/databases?databaseType=' +
      encodeURIComponent(databaseType) +
      '&connectionString=' +
      connectionString);
  }
}
