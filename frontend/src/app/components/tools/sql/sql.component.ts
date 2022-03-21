
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialog } from '@angular/material/dialog';

// Utility imports.
import { saveAs } from 'file-saver';

// Application specific imports.
import { SqlService } from '../../../services/sql.service';
import { Databases } from 'src/app/models/databases.model';
import { CacheService } from 'src/app/services/cache.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from '../../../services/feedback.service';
import { DefaultDatabaseType } from '../../../models/default-database-type.model';
import { SaveSqlDialogComponent } from './save-sql-dialog/save-sql-dialog.component';
import { LoadSqlDialogComponent } from './load-sql-dialog/load-sql-dialog.component';
import { Model } from '../../utilities/codemirror/codemirror-sql/codemirror-sql.component';

// CodeMirror options.
import sql from '../../utilities/codemirror/options/sql.json'

/**
 * SQL component allowing user to execute arbitrary SQL statements towards his or her database.
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
   * Only relevant for mssql database type, and if true, executes SQL
   * as a batch execution.
   */
  isBatch: boolean = false;

  /**
   * If true prevents returning more than 200 records from backend to avoid
   * exhausting server.
   */
  safeMode: boolean = true;

  /**
   * Result of invocation towards backend.
   */
  result: any[] = [];

  /**
   * Creates an instance of your component.
   * 
   * @param feedbackService Needed to show user feedback
   * @param cacheService Needed to be able to delete cache items in your backend
   * @param backendService Needed to retrieve user's access rights in backend
   * @param sqlService Needed to be able to execute SQL towards backend
   * @param clipboard Required to allow user to copy content to clipboard
   * @param dialog Needed to be able to show Load SQL snippet dialog
   */
  constructor(
    private feedbackService: FeedbackService,
    private cacheService: CacheService,
    public backendService: BackendService,
    private sqlService: SqlService,
    private clipboard: Clipboard,
    private dialog: MatDialog) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.sqlService.defaultDatabaseType().subscribe((defaultDatabaseType: DefaultDatabaseType) => {
      this.databaseTypes = defaultDatabaseType.options;
      this.getConnectionStrings(defaultDatabaseType.default, (connectionStrings: string[]) => {
        this.getDatabases(defaultDatabaseType.default, 'generic', (databases: any) => {
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
            database: this.databases.filter(x => x === 'magic')[0],
            options: sql,
            sql: '',
          };
          this.input.options.hintOptions = {
            tables: tables,
          };
          this.input.options.autofocus = true;
          this.input.options.extraKeys['Alt-M'] = (cm: any) => {
            cm.setOption('fullScreen', !cm.getOption('fullScreen'));
            let sidenav = document.querySelector('.mat-sidenav');
            sidenav.classList.contains('d-none') ? sidenav.classList.remove('d-none') :
            sidenav.classList.add('d-none');
          };
          this.input.options.extraKeys['Alt-L'] = (cm: any) => {
            document.getElementById('loadButton').click();
          };
          this.input.options.extraKeys['Alt-S'] = (cm: any) => {
            document.getElementById('saveButton').click();
          };
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
  databaseTypeChanged() {
    this.getConnectionStrings(this.input.databaseType, (connectionStrings: string[]) => {
      this.connectionStrings = connectionStrings;
      this.input.connectionString = null;
      this.input.database = null;
      this.input.options.hintOptions.tables = [];
      this.databases = [];
      if (this.input.databaseType !== 'mssql') {
        this.isBatch = false;
      }
    });
  }

  /**
   * Invoked when connection string is changed.
   */
  connectionStringChanged() {
    this.getDatabases(this.input.databaseType, this.input.connectionString, (databases: any) => {
      if (databases.databases && databases.databases.length > 0) {
        this.databases = databases.databases.map((x: any) => x.name).sort((lhs: string, rhs: string) => {
          return lhs > rhs ? 1 : (rhs > lhs ? -1 : 0);
        });
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
    const tables = this.databaseDeclaration.databases.filter((x: any) => x.name === this.input.database)[0].tables || [];
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
    }
  }

  /**
   * Empties server side cache and reloads your database declarations,
   * 'refreshing' your available databases.
   */
  refresh() {
    this.feedbackService.confirm(
      'Confirm action',
      'This will flush your server side cache and reload your page. Are you sure you want to do this?',
      () => {
        this.cacheService.delete('magic.sql.databases.*').subscribe(() => {
          window.location.href = window.location.href;
        }, (error: any) => this.feedbackService.showError(error));
    });
  }

  /**
   * Opens the load snippet dialog, to allow user to select a previously saved snippet.
   */
  load() {
    const dialogRef = this.dialog.open(LoadSqlDialogComponent, {
      width: '550px',
      data: this.input.databaseType,
    });
    dialogRef.afterClosed().subscribe((filename: string) => {
      if (filename) {
        this.sqlService.loadSnippet(this.input.databaseType, filename).subscribe((content: string) => {
          this.input.sql = content;
          this.filename = filename;
        }, (error: any) => this.feedbackService.showError(error));
      }
    });
  }

  /**
   * Invoked when user wants to save an SQL snippet.
   */
  save() {
    const dialogRef = this.dialog.open(SaveSqlDialogComponent, {
      width: '550px',
      data: {
        filename: this.filename || '',
        databaseType: this.input.databaseType,
      }
    });
    dialogRef.afterClosed().subscribe((filename: string) => {
      if (filename) {
        this.sqlService.saveSnippet(
          this.input.databaseType,
          filename,
          this.input.sql).subscribe(() => {
          this.feedbackService.showInfo('SQL snippet successfully saved');
          this.filename = filename;
        }, (error: any) => this.feedbackService.showError(error));
      }
    });
  }

  /**
   * Executes the current SQL towards your backend.
   */
  execute() {
    const selectedText = this.input.editor.getSelection();
    this.sqlService.executeSql(
      this.input.databaseType,
      '[' + this.input.connectionString + '|' + this.input.database + ']',
      selectedText == '' ? this.input.sql : selectedText,
      this.safeMode,
      this.isBatch).subscribe((result: any[][]) => {
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
      this.result = this.buildResult(result || []);
    }, (error: any) => {
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
   * @param result Result to toggle details for
   */
  toggleDetails(row: any, result: any) {
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
  copyToClipBoard(value: string) {

    // Using clipboard service to write specified text to clipboard.
    this.clipboard.copy(value);
    this.feedbackService.showInfoShort('Value was copied to your clipboard');
  }

  /**
   * Exports current result set as a CSV file, downloading it to the client.
   * 
   * @param result What result set to export
   */
  exportAsCsv(result: any) {
    let content = '';
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
      let first = true;
      for (let idxProperty in idxRow.data) {
        if (first) {
          first = false;
        } else {
          content += ',';
        }
        const value = idxRow.data[idxProperty];
        if (value) {
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
    this.saveAsFile(content, 'sql-export.csv', 'text/csv');
  }

  /**
   * Returns the CSS class for a row in the data table.
   * 
   * @param row Row to retrieve CSS class for
   */
  getRowCssClass(row: any) {
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
    this.sqlService.connectionStrings(databaseType).subscribe((connectionStrings: any) => {
      if (onAfter) {
        const tmp: string[] = [];
        for (var idx in connectionStrings) {
          tmp.push(idx);
        }
        onAfter(tmp);
      }
    }, (error: any) => {
      this.nullifyAllSelectors(error);
    });
  }

  /*
   * Returns all databases for database-type/connection-string from backend.
   */
  private getDatabases(databaseType: string, connectionString: string, onAfter: (databases: any) => void) {
    this.sqlService.getDatabaseMetaInfo(databaseType, connectionString).subscribe((databases: Databases) => {
      if (onAfter) {
        onAfter(databases);
      }
    }, (error: any) => {
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
    const retValue: any[] = [];
    for (const idx of result) {
      if (idx) {
        const rows = [];
        for (const inner of idx) {
          rows.push({
            data: inner,
            details: false,
            display: false,
          });
          rows.push({
            data: inner,
            details: true,
            display: false,
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
