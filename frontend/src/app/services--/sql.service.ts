
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { throwError } from 'rxjs';
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from '../_general/services/http.service';
import { Databases } from '../models/databases.model';
import { FileService } from 'src/app/services--/file.service';
import { DefaultDatabaseType } from '../models/default-database-type.model';

/**
 * SQL service allowing you to execute SQL and retrieve meta information about
 * your databases.
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
   * @param databaseType Type of database, for instance 'mssql', 'pgsql', 'sqlite' or 'mysql'.
   * @param database Database connection string (reference to appsettings.json)
   * @param sql SQL to evaluate
   * @param safeMode If true will only return the first 1.000 records
   * @param batch If true will execute SQL as a batch operation, respecting 'go' keywords. Only relevant for MS SQL.
   */
  executeSql(
    databaseType: string,
    database: string,
    sql: string,
    safeMode: boolean,
    batch: boolean) {
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
  defaultDatabaseType() {
    return this.httpService.get<DefaultDatabaseType>('/magic/system/sql/default-database-type');
  }

  /**
   * Returns all connection strings configured in your backend.
   *
   * @param databaseType Database type to retrieve connection strings for
   */
  connectionStrings(databaseType: string) {
    return this.httpService.get<any>('/magic/system/sql/connection-strings?databaseType=' + encodeURIComponent(databaseType));
  }

  /**
   * Returns SQL vocabulary auto complete object, such as table names, field names, etc.
   *
   * @param databaseType Type of database, for instance 'mssql', 'pgsql', 'sqlite' or 'mysql'.
   * @param connectionString Database connection string (reference to appsettings.json)
   */
  getDatabaseMetaInfo(databaseType: string, connectionString: string) {
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
  listSnippets(databaseType: string) {
    return this.fileService.listFiles(`/etc/${databaseType}/templates/`);
  }

  /**
   * Loads a snippet from the backend.
   *
   * @param databaseType Database type to load snippet for
   * @param filename Filename (only, no extension or folder) of snippet to load
   */
  loadSnippet(databaseType: string, filename: string) {
    if (filename.indexOf('/') !== -1) {
      return throwError(() => new Error('Not a valid filename'));
    }
    filename = `/etc/${databaseType}/templates/` + filename;
    if (!filename.endsWith('.sql')) {
      filename += '.sql';
    }
    return this.fileService.loadFile(filename);
  }

  /**
   * Saves the specified SQL snippet according to the specified argument.
   *
   * @param databaseType Database type for snippet
   * @param filename Filename to save snippet as. Notice, assumes we're only given the filename, and not the entire path. The service is responsible for prepending the folder.
   * @param content Content of snippet
   */
  saveSnippet(databaseType: string, filename: string, content: string) {
    if (filename.indexOf('/') !== -1) {
      return throwError(() => new Error('Not a valid filename'));
    }
    filename = `/etc/${databaseType}/templates/` + filename;
    if (!filename.endsWith('.sql')) {
      filename += '.sql';
    }
    return this.fileService.saveFile(filename, content);
  }

  /**
   * Adds the specified column to your table.
   *
   * @param databaseType Type of database
   * @param connectionString Connection string to use
   * @param databaseName Database name
   */
   createDatabase(
    databaseType: string,
    connectionString: string,
    databaseName: string) {
    return this.httpService.post<any>('/magic/system/sql/ddl/database', {
      databaseType,
      connectionString,
      databaseName,
    });
  }

  /**
   * Exports DDL for the specified tables in the specified database.
   *
   * @param databaseType Type of database
   * @param connectionString Connection string to use
   * @param databaseName Database name
   * @param tables List of tables to export
   * @returns
   */
  exportDdl(
    databaseType: string,
    connectionString: string,
    databaseName: string,
    tables: string[],
    full: boolean) {
      return this.httpService.post<any>('/magic/system/sql/ddl/export-tables', {
        databaseType,
        connectionString,
        databaseName,
        tables,
        full,
      });
    }

  /**
   * Drops the specified database entirely.
   *
   * @param databaseType Type of database
   * @param connectionString Connection string to use
   * @param databaseName Database name
   */
  dropDatabase(
    databaseType: string,
    connectionString: string,
    databaseName: string) {
    return this.httpService.delete<any>(
      '/magic/system/sql/ddl/database?databaseType=' +
      encodeURIComponent(databaseType) +
      '&connectionString=' +
      encodeURIComponent(connectionString) +
      '&databaseName=' +
      encodeURIComponent(databaseName));
  }

  /**
   * Adds the specified column to your table.
   *
   * @param databaseType Type of database
   * @param connectionString Connection string to use
   * @param databaseName Database name
   * @param tableName Table name
   * @param pkName Name of primary key
   * @param pkType Type of primary key
   * @param pkLength Length of primary key
   * @param pkDefault Default value for primary key
   */
  addTable(
    databaseType: string,
    connectionString: string,
    databaseName: string,
    tableName: string,
    pkName: string,
    pkType: string,
    pkLength: string,
    pkDefault: string) {
    return this.httpService.post<any>('/magic/system/sql/ddl/table', {
      databaseType,
      connectionString,
      databaseName,
      tableName,
      pkName,
      pkType,
      pkLength,
      pkDefault,
    });
  }

  /**
   * Creates a new link table with a many2many relationship between two different tables.
   *
   * @param databaseType Type of database
   * @param connectionString Connection string to use
   * @param databaseName Database name
   * @param args Link table declaration
   */
  addLinkTable(
    databaseType: string,
    connectionString: string,
    databaseName: string,
    args: any) {
    return this.httpService.post<any>('/magic/system/sql/ddl/link-table', {
      databaseType,
      connectionString,
      databaseName,
      args,
    });
  }

  /**
   * Adds the specified column to your table.
   *
   * @param databaseType Type of database
   * @param connectionString Connection string to use
   * @param databaseName Database name
   * @param tableName Table name
   * @param columnName Column name
   * @param columnType Type of column
   */
  dropTable(
    databaseType: string,
    connectionString: string,
    databaseName: string,
    tableName: string) {
    return this.httpService.delete<any>(
      '/magic/system/sql/ddl/table?databaseType=' +
      encodeURIComponent(databaseType) +
      '&connectionString=' +
      encodeURIComponent(connectionString) +
      '&databaseName=' +
      encodeURIComponent(databaseName) +
      '&tableName=' +
      encodeURIComponent(tableName));
  }

  /**
   * Adds the specified column to your table.
   *
   * @param databaseType Type of database
   * @param connectionString Connection string to use
   * @param databaseName Database name
   * @param tableName Table name
   * @param columnName Column name
   * @param columnType Type of column
   * @param foreignTable Table column links to
   * @param foreignField Field column links to
   */
  addColumn(
    databaseType: string,
    connectionString: string,
    databaseName: string,
    tableName: string,
    columnName: string,
    columnType: string,
    defaultValue: string,
    foreignTable: string,
    foreignField: string) {
    return this.httpService.post<any>('/magic/system/sql/ddl/column', {
      databaseType,
      connectionString,
      databaseName,
      tableName,
      columnName,
      columnType,
      defaultValue,
      foreignTable,
      foreignField,
    });
  }

  /**
   * Adds the specified column to your table.
   *
   * @param databaseType Type of database
   * @param connectionString Connection string to use
   * @param databaseName Database name
   * @param tableName Table name
   * @param columnName Column name
   * @param foreignTable Foreign table
   * @param foreignField Foreign table
   */
  addFk(
    databaseType: string,
    connectionString: string,
    databaseName: string,
    tableName: string,
    columnName: string,
    foreignTable: string,
    foreignField: string) {
    return this.httpService.post<any>('/magic/system/sql/ddl/foreign-key', {
      databaseType,
      connectionString,
      databaseName,
      tableName,
      columnName,
      foreignTable,
      foreignField,
    });
  }

  /**
   * Deletes the specified column from your database.
   *
   * @param databaseType Type of database
   * @param connectionString Connection string to use
   * @param databaseName Database name
   * @param tableName Table name
   * @param columnName Column name
   */
  deleteColumn(
    databaseType: string,
    connectionString: string,
    databaseName: string,
    tableName: string,
    columnName: string) {
    return this.httpService.delete<any>('/magic/system/sql/ddl/column?databaseType=' +
      encodeURIComponent(databaseType) +
      '&connectionString=' +
      encodeURIComponent(connectionString) +
      '&databaseName=' +
      encodeURIComponent(databaseName) +
      '&tableName=' +
      encodeURIComponent(tableName) +
      '&columnName=' +
      encodeURIComponent(columnName));
  }

  /**
   * Deletes the specified foreign key from your database.
   *
   * @param databaseType Type of database
   * @param connectionString Connection string to use
   * @param databaseName Database name
   * @param tableName Table name
   * @param fkName Column name
   */
   deleteFk(
    databaseType: string,
    connectionString: string,
    databaseName: string,
    tableName: string,
    fkName: string) {
    return this.httpService.delete<any>('/magic/system/sql/ddl/foreign-key?databaseType=' +
      encodeURIComponent(databaseType) +
      '&connectionString=' +
      encodeURIComponent(connectionString) +
      '&databaseName=' +
      encodeURIComponent(databaseName) +
      '&tableName=' +
      encodeURIComponent(tableName) +
      '&fkName=' +
      encodeURIComponent(fkName));
  }

  /**
   * Adds the specified column to your table.
   *
   * @param databaseType Type of database
   * @param module Database name
   * @param sql Table name
   */
   exportToModule(
    databaseType: string,
    module: string,
    sql: string) {
    return this.httpService.post<any>('/magic/system/sql/ddl/export-to-module', {
      databaseType,
      module,
      sql,
    });
  }

  /**
   * Creates a migrations script for module.
   *
   * @param databaseType Type of database
   * @param module Database name
   * @param sql Table name
   */
  createMigrationScript(
    databaseType: string,
    module: string,
    sql: string) {
      return this.httpService.post<any>('/magic/system/sql/ddl/create-migration-script', {
        databaseType,
        module,
        sql,
    });
  }
}
