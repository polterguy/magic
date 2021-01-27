
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

// Application specific imports.
import { SqlService } from '../../sql/services/sql.service';
import { Databases } from '../../sql/models/databases.model';
import { CrudifyService } from '../services/crudify.service';
import { Argument } from '../../endpoints/models/argument.model';
import { FeedbackService } from 'src/app/services/feedback.service';
import { ConfigService } from '../../config/services/config.service';
import { Model } from '../../codemirror/codemirror-sql/codemirror-sql.component';
import { DefaultDatabaseType } from '../../config/models/default-database-type.model';
import { CrudifierSqlAddArgumentDialogComponent } from './crudifier-sql-add-argument-dialog/crudifier-sql-add-argument-dialog.component';

// CodeMirror options.
import sql from '../../codemirror/options/sql.json'

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
  private databaseDeclaration: any = null;

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
   * Verbs user can select from.
   */
  public verbs: string[] = [
    'post',
    'get',
    'put',
    'delete',
  ];

  /**
   * Currently selected verb.
   */
  public verb: string;

  /**
   * Module name that becomes its second last relative URL.
   */
  public moduleName: string = '';

  /**
   * Endpoint name that becomes its very last relative URL.
   */
  public endpointName: string = '';

  /**
   * Comma separated list of roles allowed to invoke endpoint.
   */
  public authorization = 'root, admin';

  /**
   * Whether or not endpoint returns a list of items or a single item.
   */
  public isList = true;

  /**
   * List of arguments endpoint can handle.
   */
  public arguments: Argument[] = [];

  /**
   * Input SQL component model and options.
   */
  public input: Model = null;

  /**
   * Creates an instance of your component.
   * 
   * @param feedbackService Needed to show user feedback
   * @param crudifyService Needed to crudify endpoint
   * @param configService Needed to read configuration settings, more specifically default database config setting
   * @param sqlService Needed to be able to retrieve meta information from backend
   * @param dialog Needed to show modal dialog to user allowing him to add a new argument to argument collection of endpoint
   */
  constructor(
    private feedbackService: FeedbackService,
    private crudifyService: CrudifyService,
    private configService: ConfigService,
    private sqlService: SqlService,
    private dialog: MatDialog) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Defaulting verb to GET.
    this.verb = this.verbs.filter(x => x === 'get')[0];

    // Retrieving default database type from backend.
    this.configService.defaultDatabaseType().subscribe((defaultDatabaseType: DefaultDatabaseType) => {

      // Assigning database types to model.
      this.databaseTypes = defaultDatabaseType.options;

      // Retrieving connection strings for default database type.
      this.getConnectionStrings(defaultDatabaseType.default, (connectionStrings: string[]) => {

        // Retrieving databases existing in connection string instance.
        this.getDatabases(defaultDatabaseType.default, connectionStrings[0], (databases: any) => {

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
            options: sql,
            sql: '',
          };
          this.input.options.hintOptions = {
            tables: tables,
          };

          // Turning on auto focus.
          this.input.options.autofocus = true;

          // Associating ALT+M with fullscreen toggling of the editor instance.
          this.input.options.extraKeys['Alt-M'] = (cm: any) => {
            cm.setOption('fullScreen', !cm.getOption('fullScreen'));
          };
        });
      });
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Returns true if endpoint name and module name is valid.
   */
  public validModuleComponentName() {
    return /^[a-z0-9_]+$/i.test(this.endpointName) && /^[a-z0-9_]+$/i.test(this.moduleName);
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
    this.getDatabases(this.input.databaseType, this.input.connectionString, (databases: any) => {

      // Making sure connection string has at least one database.
      if (databases.databases && databases.databases.length > 0) {

        // Setting databases and hint options.
        this.databases = databases.databases.map((x: any) => x.name);

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
    const tables = this.databaseDeclaration.databases.filter((x: any) => x.name === this.input.database)[0].tables;
    for (const idxTable of tables) {
      result[idxTable.name] = idxTable.columns?.map((x: any) => x.name) || [];
    }
    this.input.options.hintOptions.tables = result;
  }

  /**
   * Generates your SQL endpoint.
   */
  public generate() {

    // Invoking backend through service instance.
    this.crudifyService.generateSqlEndpoint({
      databaseType: this.input.databaseType,
      database: this.input.database,
      authorization: this.authorization,
      moduleName: this.moduleName,
      endpointName: this.endpointName,
      verb: this.verb,
      sql: this.input.sql,
      arguments: this.getArguments(),
      overwrite: true,
      isList: this.isList}).subscribe(() => {

        // Providing feedback to user.
        this.feedbackService.showInfo('Endpoint successfully created');
      });
  }

  /**
   * Invoked when user wants to add an argument to argument declaration of endpoint.
   */
  public addArgument() {

    // Creating modal dialogue that asks user what name and type he wants to use for his argument.
    const dialogRef = this.dialog.open(CrudifierSqlAddArgumentDialogComponent, {
      width: '550px',
    });

    dialogRef.afterClosed().subscribe((argument: Argument) => {

      // Checking if modal dialog wants to jail the user.
      if (argument) {

        // Checking if argument already exists.
        if (this.arguments.filter(x => x.name === argument.name).length > 0) {

          // Oops, argument already declared.
          this.feedbackService.showError('Argument already declared, please delete the previous declaration before trying to add it again');
          return;
        }

        // Adding argument to argument declaration.
        this.arguments.push(argument);
      }
    });
  }

  /**
   * Invoked when user wants to remove an argument from collection of arguments
   * endpoint can handle.
   * 
   * @param argument Argument to remove
   */
  public removeArgument(argument: Argument) {

    // Removing argument from collection.
    this.arguments.splice(this.arguments.indexOf(argument), 1);
  }

  /**
   * Adds an argument as a reference into your SQL editor.
   * 
   * @param argument Argument to add as a reference into your SQL
   */
  public addArgumentIntoSql(argument: Argument) {

    // Simply concatenating argument into SQL.
    this.input.sql += '@' + argument.name;
  }

  /*
   * Private helper methods.
   */

  /**
   * Returns the string (Hyperlambda) representation of declared arguments.
   */
  private getArguments() {

    // Transforming list of arguments to Hyperlambda declaration.
    return this.arguments.map(x => x.name + ':' + x.type).join('\r\n');
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

    }, (error: any) => {

      // Oops, making sure we remove all selected values, and shows an error to user.
      this.input.connectionString = null;
      this.input.database = null;
      this.input.options.hintOptions.tables = [];
      this.feedbackService.showError(error);}
    );
  }

  /*
   * Returns all databases for database-type/connection-string
   * combination from backend.
   */
  private getDatabases(databaseType: string, connectionString: string, onAfter: (databases: any) => void) {

    // Retrieving databases that exists for database-type/connection-string combination in backend.
    this.sqlService.getDatabaseMetaInfo(databaseType, connectionString).subscribe((databases: Databases) => {

      // Checking if caller supplied a callback, and if so invoking it.
      if (onAfter) {

        // Invoking callback.
        onAfter(databases);
      }
    }, (error: any) => {

      // Resetting selected connection string and selected database.
      this.input.connectionString = null;
      this.input.database = null;
      this.input.options.hintOptions.tables = [];

      // Notifying user
      this.feedbackService.showError(error);
    });
  }
}
