
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, ComponentFactoryResolver, OnInit } from '@angular/core';

// Application specific imports.
import { Messages } from 'src/app/models/messages.model';
import { Database } from 'src/app/_protected/pages/sql-studio/_models/database.model';
import { Databases } from 'src/app/models/databases.model';
import { SqlService } from '../../../../services/sql.service';
import { MessageService } from 'src/app/services/message.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { CrudSqlExtraComponent } from './crud-sql-extra/crud-sql-extra.component';
import { DefaultDatabaseType } from '../../../../models/default-database-type.model';
import { Model } from '../../../utilities/codemirror/codemirror-sql/codemirror-sql.component';

// CodeMirror options.
import sqlOptions from '../../../utilities/codemirror/options/sql.json'

/**
 * Component allowing user to generate an HTTP endpoint based upon SQL.
 */
@Component({
  selector: 'app-crud-sql',
  templateUrl: './crud-sql.component.html'
})
export class CrudSqlComponent implements OnInit {

  // Database declaration as returned from server
  private databaseDeclaration: Databases = null;

  /**
   * Database types the user can select during configuration of system.
   */
  databaseTypes: string[] = [];

  /**
   * All existing connection strings for selected database type.
   */
  connectionStrings: string[] = [];

  /**
   * Databases that exists in database type/connection string instance.
   */
  databases: string[] = [];

  /**
   * Input SQL component model and options.
   */
  input: Model = null;

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
  ngOnInit() {
    this.sqlService.defaultDatabaseType().subscribe({
      next: (defaultDatabaseType: DefaultDatabaseType) => {
        this.databaseTypes = defaultDatabaseType.options;
        this.getConnectionStrings(defaultDatabaseType.default, (connectionStrings: string[]) => {
          this.getDatabases(defaultDatabaseType.default, 'generic', (databases: Databases) => {
            this.databaseDeclaration = databases;
            const tables = {};
            for (const idxTable of databases.databases.filter((x: any) => x.name === 'magic')[0].tables) {
              tables[idxTable.name] = idxTable.columns.map((x: any) => x.name);
            }
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
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Returns humanly readable type of database to caller.
   *
   * @param type Type delaration
   */
  getDatabaseTypeName(type: string) {
    switch (type) {
      case 'mysql': return 'MySQL';
      case 'sqlite': return 'SQLite';
      case 'pgsql': return 'PostgreSQL';
      case 'mssql': return 'SQL Server';
    }
  }

  /**
   * Invoked when database type is changed.
   */
  databaseTypeChanged() {
    this.getConnectionStrings(this.input.databaseType, (connectionStrings: string[]) => {
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
  connectionStringChanged() {
    this.getDatabases(this.input.databaseType, this.input.connectionString, (databases: Databases) => {
      if (databases.databases && databases.databases.length > 0) {
        this.databases = databases.databases.map((x: Database) => x.name);
        this.databaseDeclaration = databases;
        this.input.database = this.databases[0];
        this.databaseChanged();
      } else {
        this.databases = [];
        this.input.database = null;
        this.input.options.hintOptions.tables = [];
      }
    });
  }

  /**
   * Invoked when active database changes.
   */
  databaseChanged() {
    const result = {};
    const tables = this.databaseDeclaration.databases.filter((x: Database) => x.name === this.input.database)[0].tables;
    for (const idxTable of tables) {
      result[idxTable.name] = idxTable.columns?.map((x: any) => x.name) || [];
    }
    this.input.options.hintOptions.tables = result;
    this.messageService.sendMessage({
      name: Messages.CLEAR_COMPONENTS,
    });
    const componentFactory = this.resolver.resolveComponentFactory(CrudSqlExtraComponent);
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
  getDatabaseCssClass(db: string) {
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

      default:
        return '';
    }
  }

  /*
   * Private helpermethods.
   */

  /*
   * Returns all connection strings for database type from backend.
   */
  private getConnectionStrings(databaseType: string, onAfter: (connectionStrings: string[]) => void) {
    this.sqlService.connectionStrings(databaseType).subscribe({
      next: (connectionStrings: any) => {
        if (onAfter) {
          const tmp: string[] = [];
          for (var idx in connectionStrings) {
            tmp.push(idx);
          }
          onAfter(tmp);
        }
      },
      error: (error: any) => this.handleError(error)});
  }

  /*
   * Returns all databases for database-type/connection-string
   * combination from backend.
   */
  private getDatabases(databaseType: string, connectionString: string, onAfter: (databases: Databases) => void) {
    this.sqlService.getDatabaseMetaInfo(databaseType, connectionString).subscribe({
      next: (databases: Databases) => {
        if (onAfter) {
          onAfter(databases);
        }
      },
      error: (error: any) => this.handleError(error)});
  }

  /*
   * Invoked when an error occurs for some reasons.
   */
  private handleError(error: any) {
    this.input.connectionString = null;
    this.input.database = null;
    this.input.options.hintOptions.tables = [];
    this.feedbackService.showError(error);
  }
}
