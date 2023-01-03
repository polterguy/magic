
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subscription } from 'rxjs';
import { Model } from 'src/app/codemirror/codemirror-sql/codemirror-sql.component';
import { ShortkeysComponent } from 'src/app/_general/components/shortkeys/shortkeys.component';
import { GeneralService } from 'src/app/_general/services/general.service';

// CodeMirror options.
import { CodemirrorActionsService } from '../../../hyper-ide/services/codemirror-actions.service';
import { SqlService } from '../../../../../../_general/services/sql.service';
import { SqlSnippetDialogComponent } from './components/load-sql-snippet-dialog/load-sql-snippet-dialog.component';
import { SnippetNameDialogComponent } from '../../../../../../_general/components/snippet-name-dialog/snippet-name-dialog.component';

/**
 * Helper component to allo user to view his database in SQL view, as in allowing to
 * write and execute SQL towards his currently open database in SQL Studio.
 */
@Component({
  selector: 'app-sql-view',
  templateUrl: './sql-view.component.html',
  styleUrls: ['./sql-view.component.scss']
})
export class SqlViewComponent implements OnInit, OnDestroy {

  private selectedSnippet: string = '';
  private tablesList: any = null;
  private tableSubscription!: Subscription;
  private actionSubscription!: Subscription;

  @Input() hintTables: Observable<any[]>;
  @Input() selectedDatabase: string = '';
  @Input() selectedDbType: string = '';
  @Input() selectedConnectionString: string = '';
  @Output() getDatabases: EventEmitter<any> = new EventEmitter<any>();
  input: Model = null;
  queryResult: any = [];
  displayedColumns: any = [];
  executingSql: boolean = false;
  sqlFile: any;
  safeMode: boolean = true;

  constructor(
    private dialog: MatDialog,
    private sqlService: SqlService,
    private generalService: GeneralService,
    private codemirrorActionsService: CodemirrorActionsService) { }

  ngOnInit() {
    this.codeMirrorInit();
    this.watchForActions();
    this.tableSubscription = this.hintTables.subscribe((res: any) => {
      this.tablesList = res;
      if (this.input) {
        this.input.options.hintOptions = {
          tables: this.tablesList,
        };
      }
    });
  }

  codeMirrorInit() {
    this.input = {
      databaseType: this.selectedDatabase,
      connectionString: this.selectedConnectionString,
      database: this.selectedDatabase,
      options: this.getCodeMirrorOptions(),
      sql: '',
    };
    this.input.options.hintOptions = {
      tables: this.tablesList,
    };
    this.input.options.autofocus = true;
  };

  loadSnippet() {
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

  save() {
    if (!this.input?.sql && this.input.sql === '') {
      this.generalService.showFeedback('Write some SQL first, then save it', 'errorMessage', 'Ok', 5000)
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

  insertFromOpenAI(snippet: string) {
    this.input.sql = snippet;
  }

  execute() {
    if (!this.input.sql && this.input.sql === '') {
      this.generalService.showFeedback('Write some SQL first, then execute it', 'errorMessage', 'Ok', 5000)
      return;
    }
    if (this.input && this.input.editor) {
      this.executingSql = true;
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
            this.generalService.hideLoading();
            this.executingSql = false;
          },
          error: (error: any) => {
            this.executingSql = false;
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

  importSqlFile(event: any) {
    this.sqlFile = event.target.files[0];
    let fileReader = new FileReader();

    fileReader.onload = (e) => {
      this.input.sql = <any>fileReader.result;
    }

    fileReader.readAsText(this.sqlFile);
    this.sqlFile = '';
  }

  viewShortkeys() {
    this.dialog.open(ShortkeysComponent, {
      width: '900px',
      data: {
        type: ['save', 'execute', 'insertSnippet'],
      }
    });
  }

  ngOnDestroy() {
    this.tableSubscription?.unsubscribe();
    this.actionSubscription?.unsubscribe();
  }

  /*
   * Private helper methods.
   */

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

  private watchForActions() {
    this.actionSubscription = this.codemirrorActionsService.action.subscribe((action: string) => {
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

  private getCodeMirrorOptions() {
    return this.codemirrorActionsService.getActions(null, 'sql');
  }
}
