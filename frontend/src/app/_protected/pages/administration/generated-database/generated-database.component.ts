import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ReplaySubject, Subject } from 'rxjs';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { CacheService } from 'src/app/_protected/services/common/cache.service';
import { FileService } from '../../tools/hyper-ide/_services/file.service';
import { Databases } from '../../tools/database/_models/databases.model';
import { DefaultDatabaseType } from '../../tools/database/_models/default-database-type.model';
import { SqlService } from '../../tools/database/_services/sql.service';
import { ExportDdlComponent } from './components/export-ddl/export-ddl.component';
import { LinkTableComponent } from './components/link-table/link-table.component';
import { NewTableComponent } from './components/new-table/new-table.component';

@Component({
  selector: 'app-generated-database',
  templateUrl: './generated-database.component.html',
  styleUrls: ['./generated-database.component.scss']
})
export class GeneratedDatabaseComponent implements OnInit {

  /**
   * List of all database types, including type and the human readable name of each.
   */
  public databaseTypes: any = [];

  /**
   * The user's default database type.
   */
  public selectedDbType: string = '';

  /**
   * List of connection strings available for the selected database type.
   */
  public connectionStrings: string[] = [];

  /**
   * The connection string of the user's default database type.
   */
  public selectedConnectionString: string = '';

  /**
   * Available databases based on the user's selected database type and the connection string.
   */
  public databases: any = [];

  /**
   * The user's selected database name.
   */
  public selectedDatabase: string = '';

  /**
   * Specifies the view.
   * will be used to switch between table and SQLview.
   */
  public sqlView: boolean = false;

  /**
   * Tables in the user's selected database.
   */
  private _tables: ReplaySubject<any[]> = new ReplaySubject();
  public tables = this._tables.asObservable();
  private _hintTables: ReplaySubject<any> = new ReplaySubject();
  public hintTables = this._hintTables.asObservable();

  /**
   * To watch for the changes in database changes.
   */
  private _dbLoading: ReplaySubject<boolean> = new ReplaySubject();
  public dbLoading = this._dbLoading.asObservable();

  private paramDbType: string = '';
  private paramDbName: string = '';
  private paramDbConnectionString: string = '';

  public saveSnippet: Subject<any> = new Subject();
  public sqlFile: any;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private sqlService: SqlService,
    private fileService: FileService,
    private cacheService: CacheService,
    private activatedRoute: ActivatedRoute,
    private generalService: GeneralService) {
    this.activatedRoute.queryParams.subscribe((param: any) => {
      if (param && param.dbName && param.dbType && param.dbCString) {
        this.paramDbName = param.dbName;
        this.paramDbType = param.dbType;
        this.paramDbConnectionString = param.dbCString;
      }
    })
  }

  ngOnInit(): void {
    this.getDefaultDbType(true);
  }

  /**
   * Invokes endpoint to get the default database type.
   * Retrieves all available database types and specifies the default one.
   */
  private getDefaultDbType(preserveQueryParam?: boolean) {
    this._dbLoading.next(true);
    this.generalService.showLoading();
    this.sqlService.defaultDatabaseType().subscribe({
      next: (dbTypes: DefaultDatabaseType) => {
        this.selectedDbType = this.paramDbType !== '' ? this.paramDbType : dbTypes.default;
        dbTypes.options.map((item: string) => {
          this.databaseTypes.push({ name: this.getDatabaseTypeName(item), type: item });
        });

        this.getConnectionString(this.selectedDbType, this.paramDbConnectionString, preserveQueryParam);
      },
      error: (error: any) => this.generalService.showFeedback(error.error.message ?? error, 'errorMessage', 'Ok', 5000)
    });
  }

  /**
   * Returns humanly readable type of database to caller.
   * @param type Type delaration
   */
  private getDatabaseTypeName(type: string) {
    switch (type) {
      case 'mysql': return 'MySQL';
      case 'sqlite': return 'SQLite';
      case 'pgsql': return 'PostgreSQL';
      case 'mssql': return 'SQL Server';
    }
  }

  /**
   * Retrieves the connection string of the default database.
   * @param selectedDbType Default type of the databases, sets during the initial configuration.
   */
  public getConnectionString(selectedDbType: string, selectedConnectionString?: string, preserveQueryParam?: boolean) {
    this._dbLoading.next(true);
    this.selectedConnectionString = '';
    this.connectionStrings = [];
    this.selectedDbType = selectedDbType;

    this.sqlService.connectionStrings(selectedDbType).subscribe({
      next: (connectionStrings: any) => {
        this.connectionStrings = connectionStrings;
        if (connectionStrings) {
          this.selectedConnectionString = selectedConnectionString ? selectedConnectionString : (Object.keys(connectionStrings).indexOf('generic') > -1 ? 'generic' : Object.keys(connectionStrings)[0]);
          this.getDatabases(preserveQueryParam);
        }
      },
      error: (error: any) => {
        this.generalService.showFeedback(error.error.message ?? error, 'errorMessage', 'Ok', 5000);
      }
    });
  }

  /**
   * Retrieves a list of databases already available on the user's backend.
   */
  public getDatabases(preserveQueryParam?: boolean) {
    this._dbLoading.next(true);
    this.generalService.showLoading();
    this.databases = [];
    this.sqlService.getDatabaseMetaInfo(
      this.selectedDbType,
      this.selectedConnectionString).subscribe({
        next: (res: Databases) => {
          this.databases = res.databases || [];
          if (this.selectedDatabase === '') {
            if (preserveQueryParam && this.paramDbName !== '') {
              this.selectedDatabase = this.paramDbName;
            } else {
              this.selectedDatabase = this.databases[0].name;
              this.router.navigate([], {
                queryParams: {
                  dbName: null,
                  dbType: null,
                  dbCString: null,
                },
                queryParamsHandling: 'merge'
              })
            }
          } else {
            const existingDb: any = this.databases.find((db: any) => db.name === this.selectedDatabase) || [];
            if (!existingDb || !existingDb.length) {
              this.router.navigate([], {
                queryParams: {
                  dbName: null,
                  dbType: null,
                  dbCString: null,
                },
                queryParamsHandling: 'merge'
              })
            }
          }

          const tables = this.databases.find((db: any) => db.name === this.selectedDatabase)?.tables || [];
          this._tables.next(tables);
          let hintTables = this.databases.find((db: any) => db.name === this.selectedDatabase)?.tables || [];
          hintTables = hintTables.map((x: any) => [x.name, x.columns.map((y: any) => y.name)]);
          this._hintTables.next(Object.fromEntries(hintTables));
          this._dbLoading.next(false);
          this.generalService.hideLoading();
        },
        error: (error: any) => {
          this._dbLoading.next(false);
          this.generalService.hideLoading();
          this.generalService.showFeedback(error.error.message, 'errorMessage', 'Ok', 5000);
        }
      })
  }

  /**
   * Invoked when user wants to create a new table.
   */
  public addNewTable() {
    this.dialog.open(NewTableComponent, {
      width: '500px'
    }).afterClosed().subscribe((result: any) => {

      // Only creates a new table if the modal dialog returns some data.
      if (result) {
        this.sqlService.addTable(
          this.selectedDbType,
          this.selectedConnectionString,
          this.selectedDatabase,
          result.name,
          result.pkName,
          result.pkType,
          result.pkLength,
          result.pkDefault).subscribe({
            next: (result: any) => {
              this.generalService.showFeedback('Table successfully added.', 'successMessage');
              this.getDatabases();
              // this.applyMigration(result.sql);
            },
            error: (error: any) => this.generalService.showFeedback(error.error.message ?? error, 'errorMessage', 'Ok', 4000)
          });
      }
    });
  }

  /**
   * Invoked for creating a new link table.
   */
  public createNewLinkTable() {
    const tables: any = this.databases.find((db: any) => db.name === this.selectedDatabase).tables || [];
    if (tables.length === 0) {
      this.generalService.showFeedback('This database doesn\'t have tables.', 'errorMessage');
      return;
    }
    this.dialog.open(LinkTableComponent, {
      width: '500px',
      data: tables
    }).afterClosed().subscribe((res: any) => {
      if (res) {
        this.linkTables(res);
      }
    })
  }

  private linkTables(selectedTables: any) {
    const table1pk: any[] = selectedTables.table1.columns.filter((x: any) => x.primary);
    const table2pk: any[] = selectedTables.table2.columns.filter((x: any) => x.primary);
    const payload = {
      name: selectedTables.table1.name.replace('dbo.', '').replace('.', '_') + '_' + selectedTables.table2.name.replace('dbo.', '').replace('.', '_'),
      table1: selectedTables.table1.name,
      table2: selectedTables.table2.name,
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
      this.selectedDbType,
      this.selectedConnectionString,
      this.selectedDatabase,
      payload).subscribe({
        next: (result: any) => {
          this.generalService.showFeedback('Link table successfully created', 'successMessage');
          this.getDatabases(true);
          // this.applyMigration(result.sql);
        },
        error: (error: any) => this.generalService.showFeedback(error.error.message ?? error, 'errorMessage', 'Ok', 5000)
      });
  }

  /**
   * Exports the entire database as DDL and shows in a modal window.
   */
  public exportDatabase() {

    if (this.selectedDatabase === '') {
      return;
    }

    // Retrieving tables and sorting such that tables with foreign keys to other tables ends up after the table they're pointing to.
    let tables = this.databases.find((db: any) => db.name === this.selectedDatabase).tables || [];
    if (tables.length === 0) {
      this.generalService.showFeedback('This database doesn\'t have tables.');
      return;
    }
    tables = tables.sort((lhs: any, rhs: any) => {
      if (lhs.foreign_keys?.filter((x: any) => x.foreign_table === rhs.name)) {
        return 1;
      } else if (rhs.foreign_keys?.filter((x: any) => x.foreign_table === lhs.name)) {
        return -1;
      }
      return 0;
    });
    this.sqlService.exportDdl(
      this.selectedDbType,
      this.selectedConnectionString,
      this.selectedDatabase,
      tables.map((table: any) => table.name),
      true).subscribe({
        next: (result: any) => {
          const dialogRef = this.dialog.open(ExportDdlComponent, {
            width: '80vw',
            panelClass: 'light',
            data: {
              result: result.result,
              full: true,
              module: this.selectedDatabase,
              canExport: (this.selectedDatabase !== 'magic' && (this.selectedDbType === 'sqlite' || this.selectedDbType === 'mysql' || this.selectedDbType === 'pgsql'))
            }
          }).afterClosed().subscribe((result: any) => {
            if (result) {

              // Invokes endpoint to save content to a module folder.
              this.sqlService.exportToModule(
                this.selectedDbType,
                this.selectedDatabase,
                result.result,
              ).subscribe({
                next: () => {
                  this.generalService.showFeedback('Database successfully exported', 'successMessage');
                },
                error: (error: any) => this.generalService.showFeedback(error.error.message ?? error, 'errorMessage', 'Ok', 5000)
              });
            }
          });
        },
        error: (error: any) => this.generalService.showFeedback(error.error.message ?? error, 'errorMessage', 'Ok', 5000)
      });
  }

  public deleteDatabase() {
    if (this.selectedDatabase !== 'magic') {
      this.dialog.open(ConfirmationDialogComponent, {
        width: '500px',
        data: {
          title: `Delete database ${this.selectedDatabase}`,
          description_extra: `This action is permanent and you will lose all data in this database.<br/><br/>Please type in the <span class="fw-bold">database name</span> below.`,
          action_btn: `Delete database`,
          action_btn_color: 'warn',
          bold_description: true,
          extra: {
            details: this.databases.find((db: any) => db.name === this.selectedDatabase),
            action: 'confirmInput',
            fieldToBeTypedTitle: `database name`,
            fieldToBeTypedValue: this.selectedDatabase,
            icon: 'table',
          }
        }
      }).afterClosed().subscribe((result: string) => {
        if (result === 'confirm') {
          this.sqlService.dropDatabase(
            this.selectedDbType,
            this.selectedConnectionString,
            this.selectedDatabase).subscribe({
              next: () => {
                this.generalService.showFeedback('Database successfully deleted.', 'successMessage');
                this.selectedDatabase = null;
                this.getDatabases();
              },
              error: (error: any) => this.generalService.showFeedback(error.error.message ?? error, 'errorMessage', 'Ok', 5000)
            });
        }
      })
    } else {
      this.generalService.showFeedback('This database cannot be deleted.', 'errorMessage');
    }
  }

  /**
   * Downloads a backup of the currently selected SQLite database
   */
  downloadBackup() {
    this.fileService.downloadFile('/data/' + this.selectedDatabase + '.db');
  }

  public changeTable() {
    const tables = this.databases.find((db: any) => db.name === this.selectedDatabase)?.tables || [];
    this._tables.next(tables);
    let hintTables = this.databases.find((db: any) => db.name === this.selectedDatabase)?.tables || [];
    hintTables = hintTables.map((x: any) => [x.name, x.columns.map((y: any) => y.name)]);
    this._hintTables.next(Object.fromEntries(hintTables));
  }

  public clearServerCache() {
    this.generalService.showLoading();
    this.cacheService.delete('magic.sql.databases.*').subscribe(
      {
        next: () => {
          window.location.href = window.location.href;
          this.generalService.hideLoading();
        },
        error: (error: any) => {
          this.generalService.hideLoading();
          this.generalService.showFeedback(error.error.message ?? error, 'errorMessage', 'Ok', 5000)
        }
      })
  }

  public callParentAction(action: string, event?: any) {
    if (!this.sqlView) {
      this.generalService.showFeedback('Switch to SQL view first.', 'errorMessage');
      return;
    }
    if (!event) {
      this.saveSnippet.next(action);
    } else if (event) {
      this.saveSnippet.next({ action: action, event: event, slqFile: this.sqlFile });
    }
  }
}
