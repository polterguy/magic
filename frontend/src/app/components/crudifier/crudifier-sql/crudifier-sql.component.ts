
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, ComponentFactoryResolver, OnInit } from '@angular/core';

// Application specific imports.
import { Messages } from 'src/app/models/messages.model';
import { Database } from '../../sql/models/database.model';
import { SqlService } from '../../sql/services/sql.service';
import { Databases } from '../../sql/models/databases.model';
import { MessageService } from 'src/app/services/message.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { Model } from '../../codemirror/codemirror-sql/codemirror-sql.component';
import { DefaultDatabaseType } from '../../config/models/default-database-type.model';
import { CrudifierSqlExtraComponent } from './crudifier-sql-extra/crudifier-sql-extra.component';

// CodeMirror options.
import sqlOptions from '../../codemirror/options/sql.json'

/**
 * Component allowing user to generate an SQL based endpoint.
 */
@Component({
  selector: 'app-crudifier-sql',
  templateUrl: './crudifier-sql.component.html',
  styleUrls: ['./crudifier-sql.component.scss']
})
export class CrudifierSqlComponent implements OnInit {

  // Database declaration as returned from server
  private databaseDeclaration: Databases = null;

  /**
   * Database types the user can select during configuration of system.
   */
  public databaseTypes: string[] = [];

  /**
   * All existing connection strings for selected database type.
   */
  public connectionStrings: string[] = [];

  /**
   * Databases that exists in database type/connection string instance.
   */
  public databases: string[] = [];

  /**
   * Input SQL component model and options.
   */
  public input: Model = null;

  /**
   * Creates an instance of your component.
   * 
   * @param resolver Needed to be able to dynamically create the additional information component
   * @param feedbackService Needed to show user feedback
   * @param messageService Needed to publish message as we want to create additional information component
   * @param sqlService Needed to be able to retrieve meta information from backend
   */
  constructor(
    private resolver: ComponentFactoryResolver,
    private feedbackService: FeedbackService,
    private messageService: MessageService,
    private sqlService: SqlService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving default database type from backend.
    this.sqlService.defaultDatabaseType().subscribe((defaultDatabaseType: DefaultDatabaseType) => {

      // Assigning database types to model.
      this.databaseTypes = defaultDatabaseType.options;

      // Retrieving connection strings for default database type.
      this.getConnectionStrings(defaultDatabaseType.default, (connectionStrings: string[]) => {

        // Retrieving databases existing in connection string instance.
        this.getDatabases(defaultDatabaseType.default, 'generic', (databases: Databases) => {

          // Storing database declaration such that user can change active database without having to roundtrip to server.
          this.databaseDeclaration = databases;

          // Transforming from HTTP result to object(s) expected by CodeMirror.
          const tables = {};
          for (const idxTable of databases.databases.filter((x: any) => x.name === 'magic')[0].tables) {
            tables[idxTable.name] = idxTable.columns.map((x: any) => x.name);
          }

          /*
           * Initialising input now that we know the default database type, connection string,
           * and databases that exists in connection string.
           */
          this.connectionStrings = connectionStrings;
          this.databases = databases.databases.map((x: any) => x.name);
          this.input = {
            databaseType: defaultDatabaseType.default,
            connectionString: connectionStrings.filter(x => x === 'generic')[0],
            database: null,
            options: sqlOptions,
            sql: '',
          };
          this.input.options.hintOptions = {
            tables: tables,
          };
        });
      });
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when database type is changed.
   */
  public databaseTypeChanged() {

    // Retrieving all connection strings for selected database type.
    this.getConnectionStrings(this.input.databaseType, (connectionStrings: string[]) => {

      // Resetting selected connection string and selected database.
      this.connectionStrings = connectionStrings;
      this.input.connectionString = null;
      this.input.database = null;
      this.input.options.hintOptions.tables = [];
      this.databases = [];
    });
  }

  /**
   * Invoked when connection string is changed.
   */
  public connectionStringChanged() {

    // Retrieving all databases for selected database type and connection string.
    this.getDatabases(this.input.databaseType, this.input.connectionString, (databases: Databases) => {

      // Making sure connection string has at least one database.
      if (databases.databases && databases.databases.length > 0) {

        // Setting databases and hint options.
        this.databases = databases.databases.map((x: Database) => x.name);

        // Storing database declaration such that user can change active database without having to roundtrip to server.
        this.databaseDeclaration = databases;

        // Resetting other information, selecting first database by default.
        this.input.database = this.databases[0];
        this.databaseChanged();
  
      } else {

        // No databases in active connection string.
        this.databases = [];
        this.input.database = null;
        this.input.options.hintOptions.tables = [];
      }
    });
  }

  /**
   * Invoked when active database changes.
   */
  public databaseChanged() {

    // Updating SQL hints according to selected database.
    const result = {};
    const tables = this.databaseDeclaration.databases.filter((x: Database) => x.name === this.input.database)[0].tables;
    for (const idxTable of tables) {
      result[idxTable.name] = idxTable.columns?.map((x: any) => x.name) || [];
    }
    this.input.options.hintOptions.tables = result;

    // Making sure parent clears it dynamic container in case it's already got another container.
    this.messageService.sendMessage({
      name: Messages.CLEAR_COMPONENTS,
    });

    // Creating our component.
    const componentFactory = this.resolver.resolveComponentFactory(CrudifierSqlExtraComponent);

    /*
     * Signaling listener, passing in component as data, which will dynamically inject our
     * newly created component into the "additional information werapper".
     */
    this.messageService.sendMessage({
      name: Messages.INJECT_COMPONENT,
      content: {
        componentFactory,
        data: {
          input: this.input,
        }
      }
    });
  }

  /**
   * Invoked when CSS class for database name is to be returned.
   * 
   * @param db Database name
   */
   public getDatabaseCssClass(db: string) {
    switch (this.input.databaseType) {
      case 'mysql':
        switch (db) {
          case 'information_schema':
          case 'mysql':
          case 'performance_schema':
          case 'sys':
            return 'sys-database';
          default:
            return '';
        }
      case 'pgsql':
        switch (db) {
          case 'postgres':
          case 'template0':
          case 'template1':
          case 'template_postgis':
            return 'sys-database';
          default:
            return '';
        }
      case 'mssql':
        switch (db) {
          case 'master':
          case 'msdb':
          case 'model':
          case 'Resource':
          case 'tempdb':
            return 'sys-database';
          default:
            return '';
        }
    }
  }

  /*
   * Returns all connection strings for database type from backend.
   */
  private getConnectionStrings(databaseType: string, onAfter: (connectionStrings: string[]) => void) {

    // Retrieving connection strings for default database type from backend.
    this.sqlService.connectionStrings(databaseType).subscribe((connectionStrings: any) => {

      // Checking if caller supplied a callback, and if so, invoking it.
      if (onAfter) {

        // Transforming backend's result to a list of strings.
        const tmp: string[] = [];
        for (var idx in connectionStrings) {
          tmp.push(idx);
        }
        onAfter(tmp);
      }

    }, (error: any) => this.handleError(error));
  }

  /*
   * Returns all databases for database-type/connection-string
   * combination from backend.
   */
  private getDatabases(databaseType: string, connectionString: string, onAfter: (databases: Databases) => void) {

    // Retrieving databases that exists for database-type/connection-string combination in backend.
    this.sqlService.getDatabaseMetaInfo(databaseType, connectionString).subscribe((databases: Databases) => {

      // Checking if caller supplied a callback, and if so invoking it.
      if (onAfter) {

        // Invoking callback.
        onAfter(databases);
      }
    }, (error: any) => this.handleError(error));
  }

  /*
   * Invoked when an error occurs for some reasons.
   */
  private handleError(error: any) {

    // Nullifying all relevant models.
    this.input.connectionString = null;
    this.input.database = null;
    this.input.options.hintOptions.tables = [];

    // Notifying user
    this.feedbackService.showError(error);
  }
}
