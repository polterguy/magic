
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Input, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subscription } from 'rxjs';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { SqlService } from 'src/app/_general/services/sql.service';
import { AddFieldComponent } from './components/add-field-or-key/add-field-or-key.component';
import { AddMigrateScriptComponent } from './components/apply-migrate-script/apply-migrate-script.component';
import { ExportDdlComponent } from './components/export-ddl/export-ddl.component';

/**
 * Helper component for SQL Studio allowing user to view database in table view, and
 * editing database, by adding new tables, fields, keys, etc to his database of choice.
 */
@Component({
  selector: 'app-tables-view',
  templateUrl: './tables-view.component.html',
  styleUrls: ['./tables-view.component.scss']
})
export class TablesViewComponent implements OnInit, OnDestroy {

  private tablesList: any = [];
  private tableSubscription!: Subscription;

  @Input() dbLoading: boolean;
  @Input() tables: Observable<any[]>;
  @Input() databases: any[];
  @Input() selectedDatabase: string = '';
  @Input() selectedDbType: string = '';
  @Input() selectedConnectionString: string = '';
  @Input() migrate: boolean;
  @Output() getDatabases: EventEmitter<any> = new EventEmitter<any>();

  activeTable: string = null;

  constructor(
    private dialog: MatDialog,
    private sqlService: SqlService,
    private generalService: GeneralService) { }

  ngOnInit() {

    this.tableSubscription = this.tables.subscribe((res: any) => {
      this.tablesList = res;
    });
  }

  addColumnOrKey(item: any) {

    this.dialog.open(AddFieldComponent, {
      width: '500px',
      data: {
        table: item,
        tables: this.tablesList,
        databases: this.databases,
        slectedDbType: this.selectedDbType
      }
    }).afterClosed().subscribe((res: any) => {
      if (res) {

        if (!res.selectedTable) {
          this.addColumn(res, item);
        } else {
          this.addForeignKey(res, item);
        }
      }
    });
  }

  scrollTableIntoView(el: any) {

    const domEl = document.getElementById(el.foreign_table);
    domEl.scrollIntoView();
    this.activeTable = el.foreign_table;
    setTimeout(() => {
      this.activeTable = null;
    }, 2000);
  }

  dropItem(item: any, type: string, foreign_keys?: any, tableName?: string) {

    let fkName = null;

    if (type === 'column' && foreign_keys && (foreign_keys?.filter((x: any) => x.column === item.name) || []).length > 0) {
      if (this.selectedDbType === 'sqlite') {
        this.generalService.showFeedback('SQLite doesn\'t allow for deleting columns with foreign keys', 'errorMessage', 'Ok', 5000);
        return;
      } else {
        fkName = foreign_keys?.filter((x: any) => x.column === item.name)[0].name;
      }
    }

    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Delete ${type} ${item?.name}`,
        description_extra: `This action is permanent and you will lose all data in your ${type}.<br/><br/>Please type in the <span class="fw-bold">${type} name</span> below.`,
        action_btn: `Delete ${type}`,
        action_btn_color: 'warn',
        bold_description: true,
        extra: {
          details: item,
          action: 'confirmInput',
          fieldToBeTypedTitle: `${type} name`,
          fieldToBeTypedValue: item.name,
          icon: 'table',
        }
      }
    }).afterClosed().subscribe((result: string) => {

      if (result === 'confirm') {

        if (type === 'table') {

          this.deleteTable(item);

        } else if (type === 'column') {

          this.deleteColumn(item, tableName, fkName);

        } else if (type === 'index') {

          this.deleteIndex(item);

        }
      }
    });
  }

  viewTableDDL(tableName: string) {

    if (this.selectedDbType === 'mssql') {
      this.generalService.showFeedback('SQL Server does not allow us to easily view DDL');
      return;
    }

    this.generalService.showLoading();

    this.sqlService.exportDdl(
      this.selectedDbType,
      this.selectedConnectionString,
      this.selectedDatabase,
      [tableName],
      false).subscribe({
        next: (result: any) => {

          this.generalService.hideLoading();
          this.dialog.open(ExportDdlComponent, {
            width: '80vw',
            panelClass: 'light',
            data: {
              result: result.result,
              full: false,
              module: this.selectedDatabase,
              type: 'table',
            }
          }).afterClosed().subscribe((result: any) => {

            if (result) {
              this.generalService.showLoading();

              // Invokes endpoint to save content to a module folder.
              this.sqlService.exportToModule(
                this.selectedDbType,
                this.selectedDatabase,
                result.result,
              ).subscribe({
                next: () => {

                  this.generalService.showFeedback('Table successfully exported', 'successMessage');
                  this.generalService.hideLoading();
                },
                error: (error: any) => {

                  this.generalService.hideLoading();
                  this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 5000)
                }
              });
            }
          });
        },
        error: (error: any) => {

          this.generalService.hideLoading();
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 5000)
        }
      });
  }

  ngOnDestroy() {

    this.tableSubscription?.unsubscribe();
  }

  /*
   * Private helper methods.
   */

  private deleteTable(item: any) {

    this.generalService.showLoading();
    this.sqlService.dropTable(
      this.selectedDbType,
      this.selectedConnectionString,
      this.selectedDatabase,
      item.name).subscribe({
        next: (result: any) => {

          this.generalService.hideLoading();
          this.generalService.showFeedback('Table was successfully deleted', 'successMessage');
          this.getDatabases.emit(true);
          this.applyMigration(result.sql);
        },
        error: (error: any) => {

          this.generalService.hideLoading();
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 5000);
        }
      });
  }

  // Deletes the specified column.
  private deleteColumn(item: any, tableName: string, fkName: string) {

    if (fkName) {

      this.generalService.showLoading();
      this.sqlService.deleteFk(
        this.selectedDbType,
        this.selectedConnectionString,
        this.selectedDatabase,
        tableName,
        fkName).subscribe({
          next: () => {

            this.generalService.hideLoading();
            this.deleteColumn(item, tableName, null);
          },
          error: (error: any) => {

            this.generalService.hideLoading();
            this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 5000);
          }
        });
    } else {

      this.generalService.showLoading();
      this.sqlService.deleteColumn(
        this.selectedDbType,
        this.selectedConnectionString,
        this.selectedDatabase,
        tableName,
        item.name).subscribe({
          next: (result: any) => {

            this.generalService.hideLoading();
            this.generalService.showFeedback('Column successfully deleted', 'successMessage');
            this.getDatabases.emit(true);
            this.applyMigration(result.sql);
          },
          error: (error: any) => {

            this.generalService.hideLoading();
            this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 5000);
          }
        });
    }
  }

  private deleteIndex(item: any) {

    this.generalService.showLoading();
    this.sqlService.deleteIndex(
      this.selectedDbType,
      this.selectedConnectionString,
      this.selectedDatabase,
      item.name).subscribe({
        next: (result: any) => {

          this.generalService.hideLoading();
          this.generalService.showFeedback('Column successfully deleted', 'successMessage');
          this.getDatabases.emit(true);
          this.applyMigration(result.sql);
        },
        error: (error: any) => {

          this.generalService.hideLoading();
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 5000);
        }
      });
}

  // Invoked when user wants to apply migration script.
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

        this.generalService.showLoading();
        this.sqlService.createMigrationScript(
          this.selectedDbType,
          this.selectedDatabase,
          sql).subscribe({
            next: () => {

              this.generalService.hideLoading();
              this.generalService.showFeedback('Migration script successfully applied', 'successMessage');
            },
            error: () => {

              this.generalService.hideLoading();
              this.generalService.showFeedback('Something went wrong as we tried to apply migration script', 'errorMessage');
            }
          });
      }
    });
  }

  private addColumn(res: any, table: any) {

    let defaultValue = null;
    if (res.defaultValue && res.defaultValue !== '') {
      if (res.fieldType.defaultValue === 'string') {
        defaultValue = '\'' + res.defaultValue + '\'';
      } else {
        defaultValue = res.defaultValue;
      }
    }

    this.generalService.showLoading();
    this.sqlService.addColumn(
      this.selectedDbType,
      this.selectedConnectionString,
      this.selectedDatabase,
      table.name,
      res.columnName,
      res.columnType,
      defaultValue,
      res.nullable,
      res.indexed,
      res.columnLength).subscribe({
        next: (result: any) => {

          this.generalService.hideLoading();
          this.generalService.showFeedback('Column successfully added to table', 'successMessage');
          this.getDatabases.emit(true);
          this.applyMigration(result.sql);
        },
        error: (error) => {

          this.generalService.hideLoading();
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 5000);
        }
      });
  }

  private addForeignKey(res: any, table: any) {

    const selectedTable: any = res.selectedTable.columns.find((item: any) => item.name === res?.foreignField);
    this.generalService.showLoading();
    this.sqlService.addReferencedColumn(
      this.selectedDbType,
      this.selectedConnectionString,
      this.selectedDatabase,
      table.name,
      res.columnName,
      selectedTable.db,
      res.selectedTable.name,
      res.foreignField,
      res.nullable,
      res.columnLength,
      res.cascading).subscribe({
        next: (result: any) => {

          this.generalService.hideLoading();
          this.generalService.showFeedback('Foreign key successfully added to table.', 'successMessage');
          this.getDatabases.emit(true);
          this.applyMigration(result.sql);
        },
        error: (error) => {

          this.generalService.hideLoading();
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 5000);
        }
      });
  }
}
