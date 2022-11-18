import { Component, Input, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subscription } from 'rxjs';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { SqlService } from 'src/app/_protected/pages/tools/database/_services/sql.service';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { CacheService } from 'src/app/_protected/services/common/cache.service';
import { AddFieldComponent } from '../add-field/add-field.component';
import { ExportDdlComponent } from '../export-ddl/export-ddl.component';

@Component({
  selector: 'app-tables-view',
  templateUrl: './tables-view.component.html',
  styleUrls: ['./tables-view.component.scss']
})
export class TablesViewComponent implements OnInit, OnDestroy {

  @Input() dbLoading: boolean;
  @Input() tables: Observable<any>;
  @Input() databases: any;
  @Input() selectedDatabase: string = '';
  @Input() selectedDbType: string = '';
  @Input() selectedConnectionString: string = '';

  @Output() getDatabases: EventEmitter<any> = new EventEmitter<any>();

  private autoMigrate: boolean = false;

  private tablesList: any = [];

  private tableSubscription!: Subscription;

  constructor(
    private dialog: MatDialog,
    private sqlService: SqlService,
    private cacheService: CacheService,
    private backendService: BackendService,
    private generalService: GeneralService) { }

  ngOnInit(): void {
    this.tableSubscription = this.tables.subscribe((res: any) => {
      this.tablesList = res;
    });
  }

  public addField(item: any) {
    this.dialog.open(AddFieldComponent, {
      width: '500px',
      autoFocus: false,
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
    })
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
    this.sqlService.addColumn(
      this.selectedDbType,
      this.selectedConnectionString,
      this.selectedDatabase,
      table.name,
      res.columnName,
      res.columnType,
      defaultValue,
      res.nullable,
      res.columnLength).subscribe({
        next: (result: any) => {
          this.generalService.showFeedback('Column successfully added to table', 'successMessage');
          this.refetchDatabases();
          // this.applyMigration(result.sql);
        },
        error: (error) => this.generalService.showFeedback(error?.error?.message??error, 'errorMessage', 'Ok', 5000)
      });
  }

  private addForeignKey(res: any, table: any) {
    const selectedTable: any = res.selectedTable.columns.find((item: any) => item.name === res?.foreignField);
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
          this.generalService.showFeedback('Foreign key successfully added to table.', 'successMessage');
          this.refetchDatabases();
          // this.applyMigration(result.sql);
        },
        error: (error) => this.generalService.showFeedback(error?.error?.message??error, 'errorMessage', 'Ok', 5000)
      });
  }

  public dropTable(item: any, field: string, foreign_keys?: any, tableName?: string) {
    if (this.selectedDatabase !== 'magic') {
      if (field === 'column' && foreign_keys && (foreign_keys?.filter((x: any) => x.column === item.name) || []).length > 0) {
        if (this.selectedDbType === 'sqlite') {
          this.generalService.showFeedback('SQLite doesn\'t allow for deleting columns with foreign keys', 'errorMessage', 'Ok', 5000);
        } else {
          this.generalService.showFeedback('Delete foreign keys before you delete the column', 'errorMessage', 'Ok', 5000);
        }
        return;
      }
      this.dialog.open(ConfirmationDialogComponent, {
        width: '500px',
        data: {
          title: `Delete ${field} ${item?.name}`,
          description_extra: `This action is permanent and you will lose all data in your ${field}.<br/><br/>Please type in the <span class="fw-bold">${field} name</span> below.`,
          action_btn: `Delete ${field}`,
          action_btn_color: 'warn',
          bold_description: true,
          extra: {
            details: item,
            action: 'confirmInput',
            fieldToBeTypedTitle: `${field} name`,
            fieldToBeTypedValue: item.name,
            icon: 'table',
          }
        }
      }).afterClosed().subscribe((result: string) => {
        if (result === 'confirm') {
          if (field === 'table') {
            this.deleteTable(item);
          } else if (field === 'column') {
            this.deleteColumn(item, tableName);
          }
        }
      })
    } else {
      this.generalService.showFeedback('This table cannot be deleted.', 'errorMessage');
    }
  }

  private deleteTable(item: any) {
    this.sqlService.dropTable(
      this.selectedDbType,
      this.selectedConnectionString,
      this.selectedDatabase,
      item.name).subscribe({
        next: (result: any) => {
          this.generalService.showFeedback('Table was successfully deleted', 'successMessage');
          this.refetchDatabases();
          // this.applyMigration(result.sql);
        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message??error, 'errorMessage', 'Ok', 5000)
      });
  }

  private deleteColumn(item: any, tableName: string) {
    this.sqlService.deleteColumn(
      this.selectedDbType,
      this.selectedConnectionString,
      this.selectedDatabase,
      tableName,
      item.name).subscribe({
        next: (result: any) => {
          this.generalService.showFeedback('Column successfully deleted', 'successMessage');
          this.refetchDatabases();
          // this.applyMigration(result.sql);
        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message??error, 'errorMessage', 'Ok', 5000)
      });
  }

  /*
   * Applies migration scripts, if any migration scripts are returned from the server.
   */
  // private applyMigration(sql: string, ask: boolean = false) {
  //   if (this.autoMigrate) {
  //     if (ask) {
  //       this.dialog.open(ConfirmationDialogComponent, {
  //         width: '500px',
  //         data: {
  //           title: `Delete ${field} ${item?.name}`,
  //           description_extra: `This action is permanent and you will lose all data in your ${field}.<br/><br/>Please type in the <span class="fw-bold">${field} name</span> below.`,
  //           action_btn: `Delete ${field}`,
  //           action_btn_color: 'warn',
  //           bold_description: true
  //         }
  //       })
  //       this.feedbackService.confirm(
  //         'Apply migration script?',
  //         'Do you want to create a migration script for your current SQL statement(s)?',
  //         () => {
  //           this.sqlService.createMigrationScript(
  //             this.input.databaseType,
  //             this.input.database,
  //             sql).subscribe({
  //               next: () => {
  //                 this.feedbackService.showInfo('Migration script successfully added to module');
  //               },
  //               error: (error: any) => this.feedbackService.showError(error)
  //             });
  //         });
  //     } else {
  //       this.sqlService.createMigrationScript(
  //         this.input.databaseType,
  //         this.input.database,
  //         sql).subscribe({
  //           next: () => {
  //             this.feedbackService.showInfo('Migration script successfully added to module');
  //           },
  //           error: (error: any) => this.feedbackService.showError(error)
  //         });
  //     }
  //   }
  // }
  private refetchDatabases() {
    this.flushEndpointsAuthRequirements();
    this.getDatabases.emit(true);
  }
  /*
   * Will flush server side cache of endpoints (auth invocations) and re-retrieve these again.
   */
  private flushEndpointsAuthRequirements() {
    this.cacheService.delete('magic.auth.endpoints').subscribe({
      next: () => this.backendService.refetchEndpoints(),
      error: (error: any) => {}
    });
  }

  public exportTable(tableName: string) {
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
              canExport: (this.selectedDatabase !== 'magic')
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
                  this.generalService.showFeedback(error?.error?.message??error, 'errorMessage', 'Ok', 5000)
                }
              });
            }
          });
        },
        error: (error: any) => {
          this.generalService.hideLoading();
          this.generalService.showFeedback(error?.error?.message??error, 'errorMessage', 'Ok', 5000)
        }
      });
  }

  ngOnDestroy(): void {
    if(this.tableSubscription) {
      this.tableSubscription.unsubscribe();
    }
  }
}
