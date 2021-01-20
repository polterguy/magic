
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { Component } from '@angular/core';

// Application specific imports.
import { TableEx } from './models/table-ex.model';
import { DatabaseEx } from './models/database-ex.model';
import { SqlService } from '../sql/services/sql.service';
import { Databases } from '../sql/models/databases.model';
import { CrudifyService } from './services/crudify.service';

/**
 * Crudifier component for crudifying database tables.
 */
@Component({
  selector: 'app-crudifier',
  templateUrl: './crudifier.component.html',
  styleUrls: ['./crudifier.component.scss']
})
export class CrudifierComponent {

  /**
   * Options user has for selecting database types.
   */
  public databaseTypes: string[] = [
    'mysql',
    'mssql',
  ];

  /**
   * What database type user has selected.
   */
  public databaseType: string = null;

  /**
   * What connection strings user has for selected database type.
   */
  public connectionStrings: string[] = [];

  /**
   * What connection string user has selected.
   */
  public connectionString: string = null;

  /**
   * What databases user can select.
   */
  public databases: Databases = null;

  /**
   * What database user has selected.
   */
  public database: DatabaseEx = null;

  /**
   * What table user has selected.
   */
  public table: TableEx = null;

  /**
   * Creates an instance of your component.
   * 
   * @param sqlService Needed to retrieve meta information about databases from backend
   * @param crudifyService Needed to actually crudify endpoints
   */
  constructor(
    private sqlService: SqlService,
    private crudifyService: CrudifyService) { }

  /**
   * Invoked when user selects a database type.
   */
  public databaseTypeChanged() {

    // Resetting currently selected models for fields.
    this.connectionStrings = [];
    this.database = null;
    this.table = null;

    // Invoking backend to retrieve candidates for connection strings.
    this.sqlService.connectionStrings(this.databaseType).subscribe((result: any) => {

      // Assigning result from invocation to model.
      const connectionStrings: string[] = [];
      for (const idx in result) {
        connectionStrings.push(idx);
      }
      this.connectionStrings = connectionStrings;
    });
  }

  /**
   * Invoked when user selects a connection string.
   */
  public connectionStringChanged() {

    // Resetting currently selected models for fields.
    this.database = null;
    this.table = null;

    // Invoking backend to retrieve candidates for databases.
    this.sqlService.getDatabaseMetaInfo(
      this.databaseType,
      this.connectionString).subscribe((databases: Databases) => {

        // Assigning result from invocation to model.
        this.databases = databases;
      });
  }

  /**
   * Invoked when user selects a database.
   */
  public databaseChanged() {

    // Resetting currently selected models for fields.
    this.table = null;

    // Creating default values for database.
    this.createDefaultOptionsForDatabase(this.database);
  }

  /*
   * Private methods.
   */

  /*
   * Creates default crudify options for current database.
   */
  private createDefaultOptionsForDatabase(database: DatabaseEx) {

    // Looping through each table in database.
    for (const idxTable of database.tables) {

      // Creating defaults for currently iterated table.
      idxTable.moduleName = database.name;
      idxTable.moduleUrl = idxTable.name;
      idxTable.verbs = [
        { name: 'post', generate: true },
        { name: 'get', generate: true },
        { name: 'put', generate: true },
        { name: 'delete', generate: true },
      ];

      // Creating defaults for fields in table.
      for (const idxColumn of idxTable.columns) {

        // Defaulting expanded to false.
        idxColumn.expanded = false;
      }
    }
  }
}
