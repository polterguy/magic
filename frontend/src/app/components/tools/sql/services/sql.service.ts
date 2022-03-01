
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { throwError } from 'rxjs';
import { Injectable } from '@angular/core';

// Application specific imports.
import { Databases } from '../models/databases.model';
import { FileService } from 'src/app/services/file.service';
import { HttpService } from '../../../../services/http.service';
import { DefaultDatabaseType } from '../../../management/config/models/default-database-type.model';

/**
 * SQL service allowing you to execute SQL and retrieve meta information about
 * your database server(s).
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
   * @param databaseType Type of database, for instance 'mssql', 'pgsql' or 'mysql'.
   * @param database Database connection string (reference to appsettings.json)
   * @param sql SQL to evaluate
   * @param safeMode If true will only return the first 1.000 records
   * @param batch If true will execute SQL as a batch operation, respecting 'go' keywords. Only relevant for MS SQL.
   */
  public execute(
    databaseType: string,
    database: string,
    sql: string,
    safeMode: boolean,
    batch: boolean) {

    // Invoking backend and returning observable to caller.
    return this.httpService.post<any[]>('/magic/system/sql/evaluate', {
      databaseType,
      database,
      sql,
      safeMode,
      batch
    });
  }

  /**
   * Returns the type of database that is the default database used by backend.
   */
   public defaultDatabaseType() {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<DefaultDatabaseType>('/magic/system/sql/default-database-type');
  }

  /**
   * Returns all connection strings configured in your backend.
   * 
   * @param databaseType Database type to retrieve connection strings for
   */
  public connectionStrings(databaseType: string) {
    return this.httpService.get<any>(
      '/magic/system/sql/connection-strings?databaseType=' +
      encodeURIComponent(databaseType));
  }

  /**
   * Returns SQL vocabulary auto complete object, such as table names, field names, etc.
   * 
   * @param databaseType Type of database, for instance 'mssql', 'pgsql' or 'mysql'.
   * @param connectionString Database connection string (reference to appsettings.json)
   */
  public getDatabaseMetaInfo(databaseType: string, connectionString: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<Databases>('/magic/system/sql/databases?databaseType=' +
      encodeURIComponent(databaseType) +
      '&connectionString=' +
      connectionString);
  }

  /**
   * Returns a list of all SQL snippets the backend has stored.
   * 
   * @param databaseType Database type to retrieve snippets for
   */
  public snippets(databaseType: string) {
    return this.fileService.listFiles(`/etc/${databaseType}/templates/`);
  }

  /**
   * Loads a snippet from the backend.
   * 
   * @param databaseType Database type to load snippet for
   * @param filename Filename (only, no extension or folder) of snippet to load
   */
  public loadSnippet(databaseType: string, filename: string) {

    // Sanity checking invocation.
    if (filename.indexOf('/') !== -1) {
      throw throwError('Please provide me with only the filename, and not the folder');
    }

    // Making sure we use the correct folder.
    filename = `/etc/${databaseType}/templates/` + filename;
    if (!filename.endsWith('.sql')) {
      filename += '.sql';
    }

    // Returning result of invocation to file service.
    return this.fileService.loadFile(filename);
  }

  /**
   * Saves the specified SQL snippet according to the specified argument.
   * 
   * @param databaseType Database type for snippet
   * @param filename Filename to save snippet as. Notice, assumes we're only given the filename, and not the entire path. The service is responsible for prepending the folder.
   * @param content Content of snippet
   */
  public saveSnippet(databaseType: string, filename: string, content: string) {

    // Sanity checking invocation.
    if (filename.indexOf('/') !== -1) {
      throw throwError('Please provide me with only the filename, and not the folder');
    }

    // Making sure we put our file into the correct folder.
    filename = `/etc/${databaseType}/templates/` + filename;
    if (!filename.endsWith('.sql')) {
      filename += '.sql';
    }

    // Returning result of invocation to file service.
    return this.fileService.saveFile(filename, content);
  }
}
