
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialog } from '@angular/material/dialog';
import { SaveSqlDialogComponent } from './save-sql-dialog/save-sql-dialog.component';

// Utility imports.
import { saveAs } from 'file-saver';

// Application specific imports.
import { FeedbackService } from '../../services/feedback.service';
import { SqlService } from 'src/app/components/sql/services/sql.service';
import { Databases } from 'src/app/components/sql/models/databases.model';
import { Model } from '../codemirror/codemirror-sql/codemirror-sql.component';
import { ConfigService } from 'src/app/components/config/services/config.service';
import { DefaultDatabaseType } from '../config/models/default-database-type.model';
import { LoadSqlDialogComponent } from './load-sql-dialog/load-sql-dialog.component';
import { CacheService } from '../diagnostics/diagnostics-cache/services/cache.service';

// CodeMirror options.
import sql from '../codemirror/options/sql.json'
import { AuthService } from '../auth/services/auth.service';

/**
 * SQL component allowing user to execute arbitrary SQL statements towards his database.
 */
@Component({
  selector: 'app-sql',
  templateUrl: './sql.component.html',
  styleUrls: ['./sql.component.scss']
})
export class SqlComponent implements OnInit {

  // Filename as chosen during load SQL snippet or save SQL snippet.
  private filename: string;

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
   * Input SQL component model and options.
   */
  public input: Model = null;

  /**
   * Only relevant for mssql database type, and if true, executes SQL
   * as a batch execution.
   */
  public isBatch: boolean = false;

  /**
   * If true prevents returning more than 200 records from backend to avoid
   * exhausting server.
   */
  public safeMode: boolean = true;

  /**
   * Result of invocation towards backend.
   */
  public result: any[] = [];

  /**
   * Model for file uploader.
   */
  public fileInput: string;

  /**
   * Creates an instance of your component.
   * 
   * @param feedbackService Needed to show user feedback
   * @param configService Needed to read configuration settings, more specifically default database config setting
   * @param cacheService Needed to be able to delete cache items in your backend
   * @param authService Needed to check if user is authorised to access features
   * @param sqlService Needed to be able to execute SQL towards backend
   * @param dialog Needed to be able to show Load SQL snippet dialog
   * @param messageService Message service used to message other components
   */
  constructor(
    private feedbackService: FeedbackService,
    private configService: ConfigService,
    private cacheService: CacheService,
    public authService: AuthService,
    private sqlService: SqlService,
    private clipboard: Clipboard,
    private dialog: MatDialog) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving default database type from backend.
    this.configService.defaultDatabaseType().subscribe((defaultDatabaseType: DefaultDatabaseType) => {

      // Assigning database types to model.
      this.databaseTypes = defaultDatabaseType.options;

      // Retrieving connection strings for default database type.
      this.getConnectionStrings(defaultDatabaseType.default, (connectionStrings: string[]) => {

        // Retrieving databases existing in connection string instance.
        this.getDatabases(defaultDatabaseType.default, 'generic', (databases: any) => {

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
            database: this.databases.filter(x => x === 'magic')[0],
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

          // Associating ALT+L with the load snippet button.
          this.input.options.extraKeys['Alt-L'] = (cm: any) => {
            document.getElementById('loadButton').click();
          };

          // Associating ALT+S with the save snippet button.
          this.input.options.extraKeys['Alt-S'] = (cm: any) => {
            document.getElementById('saveButton').click();
          };

          // Making sure we attach the F5 button to execute SQL.
          this.input.options.extraKeys.F5 = () => {
            document.getElementById('executeButton').click();
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

      // Checking if this is anything but 'mssql', and if so, unchecking batch.
      if (this.input.databaseType !== 'mssql') {
        this.isBatch = false;
      }
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
        this.databases = databases.databases.map((x: any) => x.name).sort((lhs: string, rhs: string) => {
          return lhs > rhs ? 1 : (rhs > lhs ? -1 : 0);
        });

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
    const tables = this.databaseDeclaration.databases
      .filter((x: any) => x.name === this.input.database)[0].tables || [];
    for (const idxTable of tables) {
      result[idxTable.name] = (idxTable.columns?.map((x: any) => x.name) || []);
    }
    this.input.options.hintOptions.tables = result;
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

  /**
   * Empties server side cache and reloads your database declarations,
   * 'refreshing' your available databases.
   */
  public refresh() {

    // Asking user to confirm action, since it reloads page.
    // A bit 'dirty' but simplifies code significantly.
    this.feedbackService.confirm(
      'Confirm action',
      'This will flush your server side cache and reload your page. Are you sure you want to do this?',
      () => {

        // Invoking backend to empty database meta data cache entry.
        this.cacheService.delete('magic.sql.databases.*').subscribe(() => {

          // Reloading database meta declarations now.
          // A bit 'dirty' but simplifies code significantly.
          window.location.href = window.location.href;

        }, (error: any) => this.feedbackService.showError(error));
    });
  }

  /**
   * Opens the load snippet dialog, to allow user to select a previously saved snippet.
   */
  public load() {

    // Showing modal dialog.
    const dialogRef = this.dialog.open(LoadSqlDialogComponent, {
      width: '550px',
      data: this.input.databaseType,
    });

    // Subscribing to closed event, and if given a filename, loads it and displays it in the Hyperlambda editor.
    dialogRef.afterClosed().subscribe((filename: string) => {
      if (filename) {

        // User gave us a filename, hence we load file from backend snippet collection.
        this.sqlService.loadSnippet(this.input.databaseType, filename).subscribe((content: string) => {

          // Success!
          this.input.sql = content;
          this.filename = filename;

        }, (error: any) => this.feedbackService.showError(error));
      }
    });
  }

  /**
   * Invoked when user wants to save an SQL snippet.
   */
  public save() {

    // Showing modal dialog, passing in existing filename if any, defaulting to ''.
    const dialogRef = this.dialog.open(SaveSqlDialogComponent, {
      width: '550px',
      data: {
        filename: this.filename || '',
        databaseType: this.input.databaseType,
      }
    });

    // Subscribing to closed event, and if given a filename, loads it and displays it in the Hyperlambda editor.
    dialogRef.afterClosed().subscribe((filename: string) => {

      // Checking if user selected a file, at which point filename will be non-null.
      if (filename) {

        // User gave us a filename, hence saving file to backend snippet collection.
        this.sqlService.saveSnippet(
          this.input.databaseType,
          filename,
          this.input.sql).subscribe(() => {

          // Success!
          this.feedbackService.showInfo('SQL snippet successfully saved');
          this.filename = filename;
          
        }, (error: any) => this.feedbackService.showError(error));

      }
    });
  }

  /**
   * Executes the current SQL towards your backend.
   */
  public execute() {

    // Retrieving selected text from CodeMirror instance.
    const selectedText = this.input.editor.getSelection();

    // Invoking backend.
    this.sqlService.execute(
      this.input.databaseType,
      '[' + this.input.connectionString + '|' + this.input.database + ']',
      selectedText == '' ? this.input.sql : selectedText,
      this.safeMode,
      this.isBatch).subscribe((result: any[][]) => {

      // Success!
      if (result) {
        let count = 0;
        for (var idx of result) {
          count += (idx || []).length;
        }
        if (this.safeMode && count === 200) {
          this.feedbackService.showInfo('First 200 records returned. Turn off safe mode to return all records.');
        } else {
          this.feedbackService.showInfoShort(`${count} records returned`);
        }
      } else {
        this.feedbackService.showInfoShort('SQL successfully executed, but returned no result');
      }

      // Making sure we remove all previously viewed detail records.
      this.result = this.buildResult(result || []);

    }, (error: any) => {

      // Checking if user needs to turn on batch mode to execute his SQL.
      if (error.error &&
        error.error.message &&
        error.error.message &&
        (<string>error.error.message).toLowerCase().indexOf('incorrect syntax near \'go\'') !== -1) {
          this.feedbackService.showError('Turn ON batch mode to execute this SQL');
          return;
        }
      this.feedbackService.showError(error);
    });
  }

  /**
   * Invoked when user wants to toggle details for a row
   *
   * @param row Row to toggle details for
   */
  public toggleDetails(row: any, result: any) {

    // Checking if this is not a details row, and if so toggling its display field value.
    if (row.details === false) {
      const index = result.rows.indexOf(row) + 1;
      result.rows[index].display = !result.rows[index].display;
      row.display = !row.display;
    }
  }

  /**
   * Copies the specified text to clipboard.
   * 
   * @param value Value to copy to clipboard
   */
  public copyToClipBoard(value: string) {

    // Using clipboard service to write specified text to clipboard.
    this.clipboard.copy(value);
    this.feedbackService.showInfoShort('Value was copied to your clipboard');
  }

  /**
   * Exports current result set as a CSV file, downloading it to the client.
   * 
   * @param result What result set to export
   */
  public exportAsCsv(result: any) {

    // Building our CSV as a string.
    let content = '';

    // Iterating through each record in result set.
    let isFirst = true;
    for (let idxRow of result.rows.filter((x: any) => x.details === true)) {

      if (isFirst) {
        isFirst = false;
        let firstHeader = true;
        for (let idxHeader in idxRow.data) {
          if (firstHeader) {
            firstHeader = false;
          } else {
            content += ',';
          }
            content += idxHeader;
        }
        content += '\r\n';
      }

      // Iterating through each property in currently iterated record.
      let first = true;
      for (let idxProperty in idxRow.data) {
        if (first) {
          first = false;
        } else {
          content += ',';
        }

        // Retrieving cell value.
        const value = idxRow.data[idxProperty];
        if (value) {

          // Special handling of strings, to allow for double quotes and carriage returns.
          if (typeof value === 'string') {
            var idxContent = idxRow.data[idxProperty];
            while (idxContent.indexOf('"') !== -1) {
              idxContent = idxContent.replace('"', '""');
            }
            content += '"' + idxContent + '"';
          } else {
            content += idxRow.data[idxProperty];
          }
        }
      }
      content += '\r\n';
    }

    // Invoking saveAsFile method to allow client to download file containing CSV data.
    this.saveAsFile(content, 'sql-export.csv', 'text/csv');
  }

  /**
   * Returns the CSS class for a row in the data table.
   */
  public getRowCssClass(row: any) {
    if (row.details === false) {
      if (row.display === true) {
        return 'selected';
      } else {
        return 'data-row';
      }
    } else {
      return 'details';
    }
  }

  /*
   * Private helper methods.
   */

  /*
   * Saves the file using 'saveAs'.
   */
  private saveAsFile(buffer: any, fileName: string, fileType: string) {
    const data: Blob = new Blob([buffer], { type: fileType });
    saveAs(data, fileName);
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
      this.nullifyAllSelectors(error);
    });
  }

  /*
   * Returns all databases for database-type/connection-string from backend.
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
      this.nullifyAllSelectors(error);
    });
  }

  /*
   * Nullifies all relevant models to ensure select dropdown
  * lists no longer displays selected values.
   */
  private nullifyAllSelectors(error: any) {
    this.input.connectionString = null;
    this.input.database = null;
    this.input.options.hintOptions.tables = [];

    // Notifying user
    this.feedbackService.showError(error);
  }

  /*
   * Creates our view model from the result of invoking backend.
   *
   * The reason we need this, is to allow for tracking which records are currently
   * being viewed, in addition that we need to duplicate rows, to allow for viewing
   * a single record, in addition to viewing the details of it.
   */
  private buildResult(result: any[][]) {

    // Result array returned to caller.
    const retValue: any[] = [];
    for (const idx of result) {

      // Making sure current result set actually returned something.
      if (idx) {

        // Duplicating rows, making twice as many rows as there actually are.
        const rows = [];
        for (const inner of idx) {
          rows.push({
            data: inner,
            details: false, // Overview row's record
            display: false, // False since details are by default not displayed
          });
          rows.push({
            data: inner,
            details: true, // Detailed view's record
            display: false, // False since details are by default not displayed
          });
        }
        retValue.push({
          columns: Object.keys(idx[0]).slice(0, 5), // Making sure we never display more than 5 columns in main table
          rows,
        });
      }
    }
    return retValue;
  }
}
