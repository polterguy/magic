
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject, Subscription } from 'rxjs';
import { Model } from 'src/app/codemirror/codemirror-sql/codemirror-sql.component';
import { ShortkeysComponent } from 'src/app/_general/components/shortkeys/shortkeys.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_general/services/backend.service';

// CodeMirror options.
import { CodemirrorActionsService } from '../../../hyper-ide/_services/codemirror-actions.service';
import { SqlService } from '../../../../../../_general/services/sql.service';
import { SqlSnippetDialogComponent } from '../sql-snippet-dialog/sql-snippet-dialog.component';
import { SnippetNameDialogComponent } from '../../../../../../_general/components/snippet-name-dialog/snippet-name-dialog.component';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-sql-view',
  templateUrl: './sql-view.component.html',
  styleUrls: ['./sql-view.component.scss']
})
export class SqlViewComponent implements OnInit, OnDestroy {

  @Input() dbLoading: boolean;
  @Input() tables: Observable<any>;
  @Input() databases: any;
  @Input() selectedDatabase: string = '';
  @Input() selectedDbType: string = '';
  @Input() selectedConnectionString: string = '';
  @Input() saveSnippet: Subject<any>;
  @Output() getDatabases: EventEmitter<any> = new EventEmitter<any>();

  input: Model = null;
  canLoadSnippet: boolean = undefined;
  queryResult: any = [];

  displayedColumns: any = [];

  public selectedSnippet: string = '';

  public waitingRun: boolean = false;

  sqlFile: any;

  private saveSnippetSubscription!: Subscription;
  private tablesList: any = null;
  private tableSubscription!: Subscription;

  /**
   * If true prevents returning more than 200 records from backend to avoid
   * exhausting server.
   */
  public safeMode: boolean = true;

  constructor(
    private dialog: MatDialog,
    private sqlService: SqlService,
    private backendService: BackendService,
    private generalService: GeneralService,
    private codemirrorActionsService: CodemirrorActionsService) { }

  ngOnInit(): void {
    (async () => {
      while (!(this.tables))
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.tables) {
        this.canLoadSnippet = this.backendService.active?.access.sql.list_files;
        this.codemirrorInit();
        this.watchForActions();
        this.waitForSavingSnippet();
        this.tableSubscription = this.tables.subscribe((res: any) => {
          this.tablesList = res;
          if (this.input) {
            this.input.options.hintOptions = {
              tables: this.tablesList,
            };
          }
        });
      }
    })();
  }

  private async getCodeMirrorOptions(): Promise<any> {
    return this.codemirrorActionsService.getActions(null, 'sql').then((res: any) => { return res });
  }

  public async codemirrorInit() {
    this.input = {
      databaseType: this.selectedDatabase,
      connectionString: this.selectedConnectionString,
      database: this.selectedDatabase,
      options: await this.getCodeMirrorOptions(),
      sql: '',
    };
    this.input.options.hintOptions = {
      tables: this.tablesList,
    };
    this.input.options.autofocus = true;
  };

  /**
   * Opens the load snippet dialog, to allow user to select a previously saved snippet.
   */
  public loadSnippet() {
    this.dialog.open(SqlSnippetDialogComponent, {
      width: '550px',
      data: this.selectedDbType,
    }).afterClosed().subscribe((filename: string) => {
      if (filename) {
        this.selectedSnippet = filename;
        this.sqlService.loadSnippet(this.selectedDbType, filename).subscribe({
          next: (content: string) => {
            this.input.sql = content;
          },
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
        })
      }
    });
  }

  public save() {
    if (!this.input?.sql && this.input.sql === '') {
      this.generalService.showFeedback('Write an SQL command and then save it.', 'errorMessage', 'Ok', 5000)
      return;
    }

    if (!this.backendService.active?.access.sql.save_file) {
      this.generalService.showFeedback('You need a proper permission.', 'errorMessage', 'Ok', 5000)
      return;
    }

    this.dialog.open(SnippetNameDialogComponent, {
      width: '550px',
      data: this.selectedSnippet
    }).afterClosed().subscribe((filename: string) => {
      if (filename) {
        this.generalService.showLoading();
        this.sqlService.saveSnippet(
          this.selectedDbType,
          filename,
          this.input.sql).subscribe(
            {
              next: () => {
                this.generalService.showFeedback('SQL snippet successfully saved.', 'successMessage');
                this.selectedSnippet = filename;
                this.generalService.hideLoading();
              }, error: (error: any) => {
                this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 5000)
                this.generalService.hideLoading();
              }
            });
      }
    });
  }

  private waitForSavingSnippet() {
    this.saveSnippetSubscription = this.saveSnippet.subscribe((res: any) => {
      if (res === 'save') {
        this.save();
      }
      if (res && res.action === 'importFile') {
        this.importSqlFile(res.event)
      }
    })
  }

  /**
   * Executes the current SQL towards your backend.
   */
  public execute() {
    if (!this.input.sql && this.input.sql === '') {
      this.generalService.showFeedback('Write an SQL command and then save it.', 'errorMessage', 'Ok', 5000)
      return;
    }
    if (this.input && this.input.editor) {
      this.waitingRun = true;
      const selectedText = this.input.editor.getSelection();
      this.generalService.showLoading();
      this.sqlService.executeSql(
        this.selectedDbType,
        '[' + this.selectedConnectionString + '|' + this.selectedDatabase + ']',
        selectedText == '' ? this.input.sql : selectedText,
        this.safeMode,
        false).subscribe({
          next: (result: any[][]) => {
            if (result) {
              let count = 0;
              for (var idx of result) {
                count += (idx || []).length;
              }
              if (count === 200) {
                this.generalService.showFeedback('First 200 records returned. Turn off safe mode to return all records.', 'successMessage');
              } else {
                this.generalService.showFeedback(`${count} records returned`);
              }
            } else {
              this.generalService.showFeedback('SQL successfully executed, but returned no result', 'successMessage', 'Ok', 5000);
            }
            this.queryResult = result || [];

            this.buildTable();
            if (this.input.sql.indexOf('CREATE TABLE') > -1) {
              this.refetchDatabases();
            } else {
              this.generalService.hideLoading();
            }
            this.waitingRun = false;
            // this.applyMigration(selectedText == '' ? this.input.sql : selectedText, true);
          },
          error: (error: any) => {
            this.waitingRun = false;
            if (error.error &&
              error?.error?.message &&
              error?.error?.message &&
              (<string>error?.error?.message).toLowerCase().indexOf('incorrect syntax near \'go\'') !== -1) {
              this.generalService.showFeedback('Turn ON batch mode to execute this SQL', 'errorMessage', 'Ok', 5000);
              return;
            }
            this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 5000);
            this.generalService.hideLoading();
          }
        });
    }
  }

  private buildTable() {
    if (this.queryResult && this.queryResult.length > 0) {
      this.displayedColumns = [];

      this.queryResult.forEach((element: any, index: number) => {
        const titles = Object.keys(element[index]);
        if (titles.indexOf('password') > -1) {
          const index: number = titles.findIndex((value: string) => value === 'password');
          titles.splice(index, 1)
        }

        this.displayedColumns[index] = Object.keys(element[index]);
      });
    }
  }

  public toggleSafeMode() {
    this.safeMode === true ? this.showWarning() : this.safeMode = true;
  }

  private showWarning() {
    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: 'Attention please!',
        description: 'Disabling safe mode might result in you exhausting your server or client if you select thousands of records.',
        description_extra: '<span class="fw-bold">Are you sure you want to continue?</span>',
        action_btn: 'Yes, enable',
        action_btn_color: 'warn'
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {
        this.safeMode = false;
      }
    })
  }

  public clearSQLEditor() {
    this.input.sql = '';
    this.selectedSnippet = '';
  }

  public importSqlFile(event: any) {
    this.sqlFile = event.target.files[0];
    let fileReader = new FileReader();

    fileReader.onload = (e) => {
      this.input.sql = <any>fileReader.result;
    }

    fileReader.readAsText(this.sqlFile);
    this.sqlFile = '';
  }

  public viewShortkeys() {
    this.dialog.open(ShortkeysComponent, {
      width: '900px',
      data: {
        type: ['save', 'execute']
      }
    })
  }

  private refetchDatabases() {
    this.getDatabases.emit(true);
  }

  private watchForActions() {
    this.codemirrorActionsService.action.subscribe((action: string) => {
      switch (action) {
        case 'save':
          this.save();
          break;

        case 'insertSnippet':
          this.loadSnippet();
          break;

        case 'execute':
          this.execute();
          break;

        default:
          break;
      }
    })
  }

  ngOnDestroy(): void {
    if (this.tableSubscription) {
      this.tableSubscription.unsubscribe();
    }
    if (this.saveSnippetSubscription) {
      this.saveSnippetSubscription.unsubscribe();
    }
  }
}
