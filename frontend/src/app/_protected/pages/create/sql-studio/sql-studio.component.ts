
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { ReplaySubject } from 'rxjs';
import { Databases } from 'src/app/_general/models/databases.model';
import { CacheService } from 'src/app/_general/services/cache.service';
import { GeneralService } from 'src/app/_general/services/general.service';
import { SqlService } from '../../../../_general/services/sql.service';
import { AddMigrateScriptComponent } from './components/tables-view/components/apply-migrate-script/apply-migrate-script.component';
import { ExportDdlComponent } from './components/tables-view/components/export-ddl/export-ddl.component';
import { LinkTableComponent } from './components/tables-view/components/add-link-table/add-link-table.component';
import { NewTableComponent } from './components/tables-view/components/add-table/add-table.component';

/**
 * SQL Studio component allowing user to execute SQL, and edit his or her databases.
 */
@Component({
  selector: 'app-sql-studio',
  templateUrl: './sql-studio.component.html'
})
export class SQLStudioComponent implements OnInit {

  private _tables: ReplaySubject<any[]> = new ReplaySubject();
  private _hintTables: ReplaySubject<any> = new ReplaySubject();
  private _dbLoading: ReplaySubject<boolean> = new ReplaySubject();

  databaseTypes: any = [] = [
    {type: 'sqlite', name: 'SQLite'},
    {type: 'mysql', name: 'MySQL'},
    {type: 'mssql', name: 'SQL Server'},
    {type: 'pgsql', name: 'PostgreSQL'},
  ];

  selectedDbType: string = '';
  migrate: boolean = false;
  connectionStrings: string[] = [];
  selectedConnectionString: string = '';
  databases: any = [];
  selectedDatabase: string = '';
  sqlView: boolean = false;
  tables = this._tables.asObservable();
  hintTables = this._hintTables.asObservable();
  dbLoading = this._dbLoading.asObservable();

  constructor(
    private dialog: MatDialog,
    private sqlService: SqlService,
    private cacheService: CacheService,
    private activatedRoute: ActivatedRoute,
    private generalService: GeneralService) { }

  ngOnInit() {

    // Checking if we've got query parameters pointing to a specific database and catalog.
    this.activatedRoute.queryParams.subscribe((param: any) => {

      this.selectedConnectionString = param.dbCString ?? 'generic';
      this.selectedDatabase = param.dbName ?? 'magic';

      // Retrieving default database type and all supported database types from backend.
      this._dbLoading.next(true);
      this.generalService.showLoading();

      this.sqlService.defaultDatabaseType().subscribe({
        next: (defaultDb: {default: string, options: string[]}) => {

          this.databaseTypes = this.databaseTypes.filter(x => defaultDb.options.includes(x.type));
          this.selectedDbType = param.dbType ?? defaultDb.default;
          this.getConnectionStrings(this.selectedDbType, this.selectedConnectionString);
        },
        error: (error: any) => {

          this.generalService.hideLoading();
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        }
      });
    });
  }

  getConnectionStrings(selectedDbType: string, selectedConnectionString?: string) {

    this._dbLoading.next(true);
    this.selectedDbType = selectedDbType;
    this.connectionStrings = [];
    this.selectedConnectionString = selectedConnectionString ?? '';

    this.sqlService.connectionStrings(selectedDbType).subscribe({
      next: (connectionStrings: any) => {

        this.connectionStrings = connectionStrings;
        if (connectionStrings) {

          this.selectedConnectionString = selectedConnectionString ?
            selectedConnectionString :
            (Object.keys(connectionStrings).indexOf('generic') > -1 ? 'generic' : Object.keys(connectionStrings)[0]);
          this.getDatabases();

        } else {

          this._dbLoading.next(false);
          this.generalService.hideLoading();
          this.databases = [];
          this._tables.next([]);
          this._hintTables.next({});
        }
      },
      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }

  getDatabases() {

    this.generalService.showLoading();
    this.databases = [];

    this.sqlService.getDatabaseMetaInfo(
      this.selectedDbType,
      this.selectedConnectionString).subscribe({
        next: (res: Databases) => {

          this.databases = res.databases || [];
          if (this.selectedDatabase === '') {
            this.selectedDatabase = this.databases[0].name;
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
          this.generalService.showFeedback(error?.error?.message, 'errorMessage', 'Ok', 5000);
        }
      });
  }

  addNewTable() {

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

              this.generalService.showFeedback('Table successfully added', 'successMessage');
              this.getDatabases();
              this.applyMigration(result.sql);
            },
            error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
          });
      }
    });
  }

  createNewLinkTable() {

    const tables: any = this.databases.find((db: any) => db.name === this.selectedDatabase).tables || [];
    if (tables.length === 0) {

      this.generalService.showFeedback('This database doesn\'t have tables.', 'errorMessage');
      return;
    }
    this.dialog.open(LinkTableComponent, {
      width: '500px',
      data: tables
    }).afterClosed().subscribe((selectedTables: any) => {

      if (selectedTables) {
        const table1pk: any[] = selectedTables.table1.columns.filter((x: any) => x.primary);
        const table2pk: any[] = selectedTables.table2.columns.filter((x: any) => x.primary);
        const payload = {
          name: selectedTables.table1.name.replace('.', '_') + '_' + selectedTables.table2.name.replace('.', '_'),
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
              this.getDatabases();
              this.applyMigration(result.sql);
            },
            error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 5000)
          });
        }
    });
  }

  viewDatabaseDDL() {

    if (this.selectedDatabase === '') {
      return;
    }

    if (this.selectedDbType === 'mssql') {
      this.generalService.showFeedback('SQL Server does not allow us to easily view DDL');
      return;
    }

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
            }
          }).afterClosed().subscribe((result: any) => {

            if (result) {

              // Invokes endpoint to save content to a module folder.
              this.sqlService.exportToModule(
                this.selectedDbType,
                this.selectedDatabase,
                result.result).subscribe({
                next: () => {

                  this.generalService.showFeedback('Database successfully exported', 'successMessage');
                },
                error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 5000)
              });
            }
          });
        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 5000)
      });
  }

  changeDatabase() {

    const tables = this.databases.find((db: any) => db.name === this.selectedDatabase)?.tables || [];
    this._tables.next(tables);
    let hintTables = this.databases.find((db: any) => db.name === this.selectedDatabase)?.tables || [];
    hintTables = hintTables.map((x: any) => [x.name, x.columns.map((y: any) => y.name)]);
    this._hintTables.next(Object.fromEntries(hintTables));
  }

  clearServerCache() {

    this.generalService.showLoading();

    this.cacheService.delete('magic.sql.databases.*').subscribe({
      next: () => {

        window.location.href = window.location.href;
        this.generalService.hideLoading();
      },
      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 5000)
      }
    });
  }

  /*
   * Private helper methods
   */

  private applyMigration(sql: string) {

    if (!this.migrate) {
      return;
    }
    this.dialog.open(AddMigrateScriptComponent, {
      width: '80vw',
      data: {
        sql,
      }
    }).afterClosed().subscribe((res: any) => {

      if (res) {

        this.sqlService.createMigrationScript(
          this.selectedDbType,
          this.selectedDatabase,
          sql).subscribe({
            next: () => this.generalService.showFeedback('Migration script successfully applied'),
            error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 5000)
          });
      }
    });
  }
}
