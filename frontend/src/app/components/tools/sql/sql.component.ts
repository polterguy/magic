
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';

// Utility imports.
import { saveAs } from 'file-saver';

// Application specific imports.
import { SqlService } from '../../../services/sql.service';
import { Databases } from 'src/app/models/databases.model';
import { FileService } from 'src/app/services/file.service';
import { CacheService } from 'src/app/services/cache.service';
import { BackendService } from 'src/app/services/backend.service';
import { NewTableComponent } from './new-table/new-table.component';
import { FeedbackService } from '../../../services/feedback.service';
import { SqlWarningComponent } from './sql-warning/sql-warning.component';
import { NewDatabaseComponent } from './new-database/new-database.component';
import { NewFieldKeyComponent } from './new-field-key/new-field-key.component';
import { ExportTablesComponent } from './export-tables/export-tables.component';
import { DefaultDatabaseType } from '../../../models/default-database-type.model';
import { NewLinkTableComponent } from './new-link-table/new-link-table.component';
import { SaveSqlDialogComponent } from './save-sql-dialog/save-sql-dialog.component';
import { LoadSqlDialogComponent } from './load-sql-dialog/load-sql-dialog.component';
import { TableNameDialogComponent } from './table-name-dialog/table-name-dialog.component';
import { Model } from '../../utilities/codemirror/codemirror-sql/codemirror-sql.component';

// CodeMirror options.
import sql from '../../utilities/codemirror/options/sql.json'
import { ViewAppDialogComponent } from '../plugins/view-app-dialog/view-app-dialog.component';
import { ConfigService } from 'src/app/services/config.service';
import { BazarService } from '../../management/services/bazar.service';
import { MessageService } from 'src/app/services/message.service';
import { LoaderService } from 'src/app/services/loader.service';
import { environment } from 'src/environments/environment';
import { ConfirmUninstallDialogComponent } from '../plugins/confirm-uninstall-dialog/confirm-uninstall-dialog.component';

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
   * If true, migration scripts will be automatically created.
   */
  autoMigrate = false;

  /**
   * Card that's currently animated due to being selected.
   */
  animating = '';

  /**
   * Table card that is currently highlighted.
   */
  highlighted = '';

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
   * If true, user wants to see DDL for currently selected database.
   */
  designer: boolean = true;

  /**
   * Tables in currently active database.
   */
  activeTables: any[];

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
   * Input file for importing SQL
   */
  sqlFile: any;

  /**
   * List of databases as plugins to show Temporarily.
   */
  public dbPluginList: any = [];

  /**
   * SignalR hub connection, used to connect to Bazar server and get notifications
   * when app is ready to be installed.
   */
  hubConnection: HubConnection = null;

  public hiddenPanel: boolean = false;

  /**
   * Creates an instance of your component.
   *
   * @param feedbackService Needed to show user feedback
   * @param cacheService Needed to be able to delete cache items in your backend
   * @param backendService Needed to retrieve user's access rights in backend
   * @param sqlService Needed to be able to execute SQL towards backend
   * @param clipboard Required to allow user to copy content to clipboard
   * @param dialog Needed to be able to show Load SQL snippet dialog
   * @param bazarService Needed to retrieve apps from external Bazar server
   * @param messageService Needed to subscribe to messages published when app should be immediately installed
   * @param loaderService Needed to show loading when socket is connected
   */
  constructor(
    private feedbackService: FeedbackService,
    private cacheService: CacheService,
    public backendService: BackendService,
    private sqlService: SqlService,
    private clipboard: Clipboard,
    private dialog: MatDialog,
    private ngZone: NgZone,
    private fileService: FileService,
    private cdr: ChangeDetectorRef,
    private bottomSheet: MatBottomSheet,
    private bazarService: BazarService,
    private messageService: MessageService,
    private loaderService: LoaderService,
    private configService: ConfigService) {
      sessionStorage.getItem('dbPanel') === 'show' || !sessionStorage.getItem('dbPanel') ? this.hiddenPanel = false : this.hiddenPanel = true;
    }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.sqlService.defaultDatabaseType().subscribe({
      next: (defaultDatabaseType: DefaultDatabaseType) => {
        this.databaseTypes = defaultDatabaseType.options;
        this.getConnectionStrings(defaultDatabaseType.default, (connectionStrings: string[]) => {
          this.getDatabases(defaultDatabaseType.default, 'generic', (databases: any) => {
            this.databaseDeclaration = databases;
            const tables = {};
            this.activeTables = databases.databases.filter((x: any) => x.name === 'magic')[0].tables;
            for (const idxTable of this.activeTables) {
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
              this.ngZone.run(() => {
                this.load();
              });
            };
            this.input.options.extraKeys['Alt-S'] = (cm: any) => {
              this.ngZone.run(() => {
                this.save();
              });
            };
            this.input.options.extraKeys.F5 = () => {
              this.ngZone.run(() => {
                this.execute();
              });
            };

          });
        });
      },
      error: (error) => this.feedbackService.showError(error)
    });

    if (this.hiddenPanel === false) {
      this.getItems();
    }
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
    this.activeTables = this.databaseDeclaration.databases?.filter((x: any) => x.name === this.input.database)[0].tables || [];
    for (const idxTable of this.activeTables) {
      result[idxTable.name] = (idxTable.columns?.map((x: any) => x.name) || []);
    }
    this.input.options.hintOptions.tables = result;
    if (this.input.database === 'magic') {
      this.autoMigrate = false;
    }
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

      default:
        return '';
    }
  }

  /**
   * Invoked when the "Batch" property is changed.
   */
  batchChanged() {
    if (this.isBatch && this.databases.filter(x => x === 'model').length > 0 && this.input.database !== 'model') {
      this.input.database = 'model';
      this.feedbackService.showInfo('Your active database was changed to \'model\'');
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
        this.cacheService.delete('magic.sql.databases.*').subscribe(
          {
            next: () => {
              window.location.href = window.location.href;
            },
            error: (error: any) => this.feedbackService.showError(error)
          })
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
        this.sqlService.loadSnippet(this.input.databaseType, filename).subscribe({
          next: (content: string) => {
            this.input.sql = content;
            this.filename = filename;
          },
          error: (error: any) => this.feedbackService.showError(error)
        })
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
          this.input.sql).subscribe(
            {
              next: () => {
                this.feedbackService.showInfo('SQL snippet successfully saved');
                this.filename = filename;
              }, error: (error: any) => this.feedbackService.showError(error)
            });
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
        this.applyMigration(selectedText == '' ? this.input.sql : selectedText, true);
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
   * Exports current result set as a SQL file, downloading it to the client.
   *
   * @param result What result set to export
   */
  exportAsSql(result: any) {
    let headContent: string[] = [];
    let columns: string = '';
    let valueContent: string[] = [];
    let rowContent: any = [];
    let insertValue = '';

    const dialogRef = this.dialog.open(TableNameDialogComponent, {
      width: '450px',
    });
    dialogRef.afterClosed().subscribe(tableName => {
      if (tableName) {
        Object.keys(result.rows[0].data).forEach((key) => {
          headContent.push(key);
        });
        columns = 'insert into ' + tableName + ' (' + headContent + ')';

        result.rows.forEach((element: any) => {
          if (element.details === true) {
            valueContent.push(element.data);
          }
        });

        Object.keys(valueContent).forEach((key) => {
          const value = valueContent[key];

          for (let i = 0; i < Object.values(value).length; i++) {
            let element = Object.values(value)[i];

            if (element) {
              if (i < Object.values(value).length - 1) {
                if (typeof element === 'string') {
                  insertValue += '"' + element.split('\\').join('\\\\').split('"').join('""').split('\r').join('\\r').split('\n').join('\\n') + '",';
                } else {
                  insertValue += element + ',';
                }
              } else {
                if (typeof element === 'string') {
                  insertValue += '"' + element.split('\\').join('\\\\').split('"').join('""').split('\r').join('\\r').split('\n').join('\\n') + '"';
                } else {
                  insertValue += element;
                }
              }
            } else {
              if (i < Object.values(value).length - 1) {
                insertValue += 'null,';
              } else {
                insertValue += 'null';
              }
            }
          }

          rowContent.push(columns + ' values (' + insertValue + ')');
          insertValue = '';
        });

        this.saveAsFile(rowContent.join(';\r\n') + ';\r\n', 'import-into-' + tableName + '.sql', 'text/plain');
      }
    });
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

  uploadFiles(event) {
    this.sqlFile = event.target.files[0];
    let fileReader = new FileReader();

    fileReader.onload = (e) => {
      this.input.sql = <any>fileReader.result;
      this.cdr.markForCheck();
      this.cdr.detectChanges();

      setTimeout(() => {
        var domNode = (<any>document.querySelector('.CodeMirror'));
        var editor = domNode.CodeMirror;
        editor.doc.markClean();
        editor.doc.clearHistory(); // To avoid having initial loading of file becoming an "undo operation".
      }, 1);
    }

    fileReader.readAsText(this.sqlFile);
    this.sqlFile = '';
  }

  showWarning() {
    this.safeMode === false ? this.bottomSheet.open(SqlWarningComponent) : '';
  }

  /**
   * Deletes the specified column in the specified table
   *
   * @param table Table columns belongs to
   * @param column Column to delete
   */
  deleteColumn(table: any, column: any) {
    if ((table.foreign_keys?.filter((x: any) => x.column === column.name) || []).length > 0) {
      if (this.input.databaseType === 'sqlite') {
        this.feedbackService.showError('SQLite doesn\'t allow for deleting columns with foreign keys');
      } else {
        this.feedbackService.showError('Delete foreign keys before you delete the column');
      }
      return;
    }
    this.feedbackService.confirm('Warning!', 'Are you sure you want to delete the column called <strong>' + column.name +
      '</strong>? This action is permanent and will delete all data existing in the column.', () => {
        const tableName = table.name;
        const columnName = column.name;
        this.sqlService.deleteColumn(
          this.input.databaseType,
          this.input.connectionString,
          this.input.database,
          tableName,
          columnName).subscribe({
            next: (result: any) => {
              this.feedbackService.showInfo('Column successfully deleted');
              this.reloadDatabases();
              this.applyMigration(result.sql);
            },
            error: (error: any) => this.feedbackService.showError(error)
          });
      });
  }

  /**
   * Deletes the specified foreign key in the specified table
   *
   * @param table Table columns belongs to
   * @param fk Foreign key to delete
   */
  deleteFk(table: any, fk: any) {
    this.feedbackService.confirm('Warning!', 'Are you sure you want to delete the foreign key called <strong>' + fk.name +
      '</strong>? This action is permanent.', () => {
        const tableName = table.name;
        const columnName = fk.name;
        this.sqlService.deleteFk(
          this.input.databaseType,
          this.input.connectionString,
          this.input.database,
          tableName,
          columnName).subscribe({
            next: (result: any) => {
              this.feedbackService.showInfo('Foreign key successfully deleted');
              this.reloadDatabases();
              this.applyMigration(result.sql);
            },
            error: (error: any) => this.feedbackService.showError(error)
          });
      });
  }

  /**
   * Creates a new field or key for specified table.
   *
   * @param table Table to create field or key for
   */
  createFieldKey(table: any) {
    const dialogRef = this.dialog.open(NewFieldKeyComponent, {
      width: '550px',
      data: {
        databaseType: this.input.databaseType,
        connectionString: this.input.connectionString,
        table: table.name,
        database: this.databaseDeclaration.databases.filter((x: any) => x.name === this.input.database)[0],
        type: 'field',
        acceptNull: true,
        hasKey: false,
      }
    });
    dialogRef.afterClosed().subscribe((result: any) => {

      // We should only create a new field/key if the modal dialog returns some data to us.
      if (result) {
        switch (result.type) {

          case 'field':
            if (result.databaseType === 'pgsql' && result.datatype.name === 'timestamp') {
              result.datatype.name += ' with time zone';
            }
            this.sqlService.addColumn(
              result.databaseType,
              result.connectionString,
              result.database.name,
              result.table,
              result.name,
              result.datatype.name + (result.size ? ('(' + result.size + ')') : '') + (result.acceptNull ? '' : ' not null'),
              !result.defaultValue || result.defaultValue === '' ? null : (result.datatype.defaultValue ? (result.datatype.defaultValue === 'string' ? ('\'' + result.defaultValue + '\'') : result.defaultValue) : null),
              result.foreignTable,
              result.foreignField).subscribe({
                next: (result: any) => {
                  this.feedbackService.showInfo('Column was successfully added to table');
                  this.getDatabases(this.input.databaseType, this.input.connectionString, (databases: any) => {
                    this.reloadDatabases();
                  });
                  this.applyMigration(result.sql);
                },
                error: (error) => this.feedbackService.showError(error)
              });
            break;

          case 'key':
            this.sqlService.addFk(
              result.databaseType,
              result.connectionString,
              result.database.name,
              result.table,
              result.field,
              result.foreignTable,
              result.foreignField).subscribe({
                next: (result: any) => {
                  this.feedbackService.showInfo('Foreign key was successfully added to table');
                  this.reloadDatabases();
                  this.applyMigration(result.sql);
                },
                error: (error) => this.feedbackService.showError(error)
              });
            break;
        }
      }
    });
  }

  /**
   * Deletes the specified table.
   *
   * @param table Table declaration
   */
  deleteTable(table: any) {
    this.feedbackService.confirm('Warning!', 'Are you sure you want to drop table <strong>' + table.name +
      '</strong>? This action is permanent and you will lose all data in your table.', () => {
        this.sqlService.dropTable(
          this.input.databaseType,
          this.input.connectionString,
          this.input.database,
          table.name).subscribe({
            next: (result: any) => {
              this.feedbackService.showInfo('Table was successfully dropped');
              this.reloadDatabases();
              this.applyMigration(result.sql);
            },
            error: (error: any) => this.feedbackService.showError(error)
          });
      });
  }

  /**
   * Invoken when user wants to create a new database.
   */
  createNewDatabase() {
    const dialogRef = this.dialog.open(NewDatabaseComponent, {
      width: '550px',
      data: {
      }
    });
    dialogRef.afterClosed().subscribe((result: any) => {

      // We should only create a new database if the modal dialog returns some data to us.
      if (result) {
        this.sqlService.createDatabase(
          this.input.databaseType,
          this.input.connectionString,
          result.name).subscribe({
            next: () => {
              this.feedbackService.showInfo('Database successfully create');
              this.reloadDatabases(() => this.input.database = result.name);
            },
            error: (error: any) => this.feedbackService.showError(error)
          });
      }
    });
  }

  /**
   * Invoked when user wants to create a new table.
   */
  createNewTable() {
    const dialogRef = this.dialog.open(NewTableComponent, {
      width: '550px',
      data: {}
    });
    dialogRef.afterClosed().subscribe((result: any) => {

      // We should only create a new field/key if the modal dialog returns some data to us.
      if (result) {
        this.sqlService.addTable(
          this.input.databaseType,
          this.input.connectionString,
          this.input.database,
          result.name,
          result.pkName,
          result.pkType,
          result.pkLength,
          result.pkDefault).subscribe({
            next: (result: any) => {
              this.feedbackService.showInfo('Table successfully added');
              this.reloadDatabases();
              this.applyMigration(result.sql);
            },
            error: (error: any) => this.feedbackService.showError(error)
          });
      }
    });
  }

  /**
   * Invoked when user wants to create a new link table.
   */
  createNewLinkTable() {
    const dialogRef = this.dialog.open(NewLinkTableComponent, {
      width: '550px',
      data: {
        tables: this.databaseDeclaration.databases.filter((x: any) => x.name === this.input.database)[0].tables,
      },
    });
    dialogRef.afterClosed().subscribe((result: any) => {

      // We should only create a new field/key if the modal dialog returns some data to us.
      if (result) {
        const table1 = result.tables.filter((x: any) => x.name === result.table1)[0];
        const table2 = result.tables.filter((x: any) => x.name === result.table2)[0];
        const table1pk: any[] = table1.columns.filter((x: any) => x.primary);
        const table2pk: any[] = table2.columns.filter((x: any) => x.primary);
        const payload = {
          name: table1.name + '_' + table2.name,
          table1: table1.name,
          table2: table2.name,
          table1pk: table1pk.map((x: any) => {
            return {
              type: x.db,
              name: x.name,
            }
          }),
          table2pk: table2pk.map((x: any) => {
            return {
              type: x.db,
              name: x.name,
            }
          }),
        };
        this.sqlService.addLinkTable(
          this.input.databaseType,
          this.input.connectionString,
          this.input.database,
          payload).subscribe({
            next: (result: any) => {
              this.feedbackService.showInfo('Link table successfully created');
              this.reloadDatabases();
              this.applyMigration(result.sql);
            },
            error: (error: any) => this.feedbackService.showError(error)
          });
      }
    });
  }

  /**
   * Exports the entire database as DDL and shows in a modal window.
   */
  exportDatabase() {

    // Retrieving tables and sorting such that tables with foreign keys to other tables ends up after the table they're pointing to.
    let tables = this.activeTables;
    tables = tables.sort((lhs: any, rhs: any) => {
      if (lhs.foreign_keys?.filter((x: any) => x.foreign_table === rhs.name)) {
        return 1;
      } else if (rhs.foreign_keys?.filter((x: any) => x.foreign_table === lhs.name)) {
        return -1;
      }
      return 0;
    });
    this.sqlService.exportDdl(
      this.input.databaseType,
      this.input.connectionString,
      this.input.database,
      tables.map(x => x.name),
      true).subscribe({
        next: (result: any) => {
          const dialogRef = this.dialog.open(ExportTablesComponent, {
            width: '80%',
            data: {
              result: result.result,
              full: true,
              module: this.input.database,
            }
          });
          dialogRef.afterClosed().subscribe((result: any) => {
            if (result) {

              // User wants to save content to a module folder.
              this.sqlService.exportToModule(
                this.input.databaseType,
                this.input.database,
                result.result,
              ).subscribe({
                next: () => {
                  this.feedbackService.showInfo('SQL successfully exported');
                },
                error: (error: any) => this.feedbackService.showError(error)
              });
            }
          });
        },
        error: (error: any) => this.feedbackService.showError(error)
      });
  }

  /**
   * Exports the specified table's DDL.
   *
   * @param table Table to export DDL for
   */
  exportTable(table: any) {
    this.sqlService.exportDdl(
      this.input.databaseType,
      this.input.connectionString,
      this.input.database,
      [table.name],
      false).subscribe({
        next: (result: any) => {
          this.dialog.open(ExportTablesComponent, {
            width: '80%',
            data: {
              result: result.result,
              full: false,
              module: this.input.database,
            }
          });
        },
        error: (error: any) => this.feedbackService.showError(error)
      });
  }

  /**
   * Drops the currently active database.
   */
  deleteDatabase() {
    this.feedbackService.confirm('Warning!', 'Are you sure you want to drop the database <strong>' + this.input.database +
      '</strong>? This action is permanent and you will lose all data in your database.', () => {
        this.sqlService.dropDatabase(
          this.input.databaseType,
          this.input.connectionString,
          this.input.database).subscribe({
            next: () => {
              this.feedbackService.showInfo('Database successfully dropped');
              this.input.database = null;
              this.reloadDatabases();
            },
            error: (error: any) => this.feedbackService.showError(error)
          });
      });
  }

  /**
   * Scrolls the specified element into view.
   *
   * @param id ID of element to scroll into view
   */
  scrollIntoView(id: string) {
    const el = document.getElementById(id);
    el.scrollIntoView({ behavior: 'smooth' });
    this.animating = id;
    this.highlighted = id;
    setTimeout(() => this.animating = '', 2000);
  }

  /**
   * Closes result card.
   */
  closeResult() {
    this.result = null;
  }

  /**
   * Downloads a backup of the currently selected SQLite database
   */
  downloadBackup() {
    this.fileService.downloadFile('/data/' + this.input.database + '.db');
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
    this.sqlService.getDatabaseMetaInfo(databaseType, connectionString).subscribe({
      next: (databases: Databases) => {
        if (onAfter) {
          onAfter(databases);
        }
      },
      error: (error: any) => {
        this.nullifyAllSelectors(error);
      }
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
    if (error) {
      this.feedbackService.showError(error);
    }
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

  /*
   * Reloads all databases from backend.
   */
  private reloadDatabases(inject: () => void = null) {
    this.getDatabases(this.input.databaseType, this.input.connectionString, (databases: any) => {
      this.databaseDeclaration = databases;
      if (inject) {
        inject();
      }
      this.databases = databases.databases.map((x: any) => x.name);
      if (this.input.database) {
        const tables = [];
        this.activeTables = databases.databases.filter((x: any) => x.name === this.input.database)[0].tables || [];
        for (const idxTable of this.activeTables) {
          tables[idxTable.name] = idxTable.columns.map((x: any) => x.name);
        }
        this.input.options.hintOptions.tables = tables;
      }
    });
  }

  /*
   * Applies migration scripts, if any migration scripts are returned from the server.
   */
  private applyMigration(sql: string, ask: boolean = false) {
    if (this.autoMigrate) {
      if (ask) {
        this.feedbackService.confirm(
          'Apply migration script?',
          'Do you want to create a migration script for your current SQL statement(s)?',
          () => {
            this.sqlService.createMigrationScript(
              this.input.databaseType,
              this.input.database,
              sql).subscribe({
                next: () => {
                  this.feedbackService.showInfo('Migration script successfully added to module');
                },
                error: (error: any) => this.feedbackService.showError(error)
              });
          });
      } else {
        this.sqlService.createMigrationScript(
          this.input.databaseType,
          this.input.database,
          sql).subscribe({
            next: () => {
              this.feedbackService.showInfo('Migration script successfully added to module');
            },
            error: (error: any) => this.feedbackService.showError(error)
          });
      }
    }
  }



  /*
   * Lists apps from Bazar server.
   */
  private getItems(first: boolean = false) {
    this.bazarService.listBazarItems(
      '%' + '' + '%',
      0,
      100).subscribe({
        next: (apps: any[]) => {
          this.dbPluginList = apps.filter((item: any) => item.name.includes('SQLite'));
          this.dbPluginList.map((item: any) => item.dbName = (item.name.substring(7, item.name.length - 3)).toLowerCase());
          this.dbPluginList.unshift(this.dbPluginList.splice(this.dbPluginList.findIndex((item: any) => item.folder_name === 'sqlite-chinook'), 1)[0])
          this.loadManifests();
        },
        error: (error: any) => this.feedbackService.showError(error)
      });
  }

  /**
   * Invoked when a user clicks a specific app to view details about it.
   * Temporary, to be removed later.
   * @param app What app the user clicked
   */
  viewApp(app: any) {
    this.dialog.open(ViewAppDialogComponent, {
      data: {
        app: app,
        purchase: (app: any, after: () => void) => this.purchaseImplementation(app, after)
      },
      width: '90%',
      maxWidth: '90vw',
      maxHeight: '90%',
      panelClass: ['details-dialog']
    });
  }

  /*
   * Purchase implementation method.
   */
  public purchaseImplementation(app: any, onAfter: () => void = null) {
    this.backendService.showObscurer(true);
    this.configService.rootUserEmailAddress().subscribe({
      next: (response: any) => {
        this.bazarService.purchaseBazarItem(
          app,
          response.name,
          response.email,
          false,
          null).subscribe({
            next: (status: any) => {

              // Making sure we show loading animation.
              this.loaderService.show();
              /*
               * App can immediately be installed, and status.token contains
               * download token.
               */
              this.messageService.sendMessage({
                name: 'magic.bazar.install-immediately',
                content: {
                  app: app,
                  code: status.code,
                }
              });
              this.waitForCallback(status.code, app);
              if (onAfter) {
                onAfter();
              }
            },
            error: (error: any) => {
              this.feedbackService.showError(error);
              this.backendService.showObscurer(false);
            }
          });
      },
      error: (error: any) => { this.backendService.showObscurer(false); }
    })
  }

  /*
   * Creates a SignalR subscriber that waits for the Bazar to publish a message verifying
   * that the payment has been accepted.
   */
  private waitForCallback(token: string, app: any) {
    this.loaderService.show();

    let builder = new HubConnectionBuilder();
    this.hubConnection = builder.withUrl(environment.bazarUrl + '/sockets', {
      skipNegotiation: true,
      transport: HttpTransportType.WebSockets,
    }).build();

    /*
     * Subscribing to SignalR message from Bazar that is published
     * once app is ready to be downloaded.
     */
    this.hubConnection.on('bazar.package.avilable.' + token, (args: string) => {
      this.install(app, token);
    });

    this.hubConnection.start().then(() => {
      this.install(app, token);
    });
  }

  /*
   * Invoked when app should be installed, which is only possible after
   * PayPal has accepted the payment from the user.
   */
  private install(app: any, token: string) {

    this.bazarService.downloadBazarItem(app, token).subscribe({
      next: (download: any) => {
        this.bazarService.installBazarItem(app.folder_name, app.version, app.name, token).subscribe({
          next: (install: any) => {
            if (install.result === 'success') {

              /*
               * Making sure we turn OFF socket connections if these have been created.
               *
               * Notice, socket connections are NOT turned on for immediate downloads (free apps).
               */
              if (this.hubConnection) {
                this.hubConnection.stop();
                this.hubConnection = null;
                this.loaderService.hide();
                this.dialog.closeAll();
              }
              setTimeout(() => {
                this.loadManifests();
                this.input.database = app.dbName;
                this.getDatabases('sqlite', this.input.connectionString, (databases: any) => {
                  this.input.database = app.dbName;
                  this.reloadDatabases(() => {
                    setTimeout(() => {
                      this.backendService.showObscurer(false);
                      this.feedbackService.showInfo('Plugin was successfully installed on your server');
                      this.databaseChanged();
                    }, 100);
                  });
                });
              }, 100);

            } else {
              this.feedbackService.showError('Something went wrong when trying to install Bazar app. Your log might contain more information.');
            }
          },
          error: (error: any) => { this.backendService.showObscurer(false); this.feedbackService.showError(error) }
        });
      },
      error: (error: any) => { this.backendService.showObscurer(false); this.feedbackService.showError(error) }
    });
  }

  /*
   * Loads manifests of installed apps from current installation.
   */
  private loadManifests() {

    // Retrieving app manifests from local backend.
    this.bazarService.localManifests().subscribe({
      next: (manifests: any[]) => {
        this.dbPluginList.map((el: any) => {
          el.isInstalled = (manifests?.findIndex((item: any) => el.name === item.name) > -1);
        })
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Uninstalls the specified plugin.
   *
   * @param item Item to uninstall
   */
   uninstallPlugin(module_name: string) {

    this.dialog.open(ConfirmUninstallDialogComponent, {
      data: module_name,
      width: '500px'
    }).afterClosed().subscribe((result: string) => {
      if (result) {
        this.loadManifests();
      }
    });
  }

  public togglePanel() {
    this.hiddenPanel = !this.hiddenPanel;
    this.hiddenPanel ? sessionStorage.setItem('dbPanel', 'hide') : sessionStorage.setItem('dbPanel', 'show');
  }
}
