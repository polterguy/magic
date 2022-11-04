import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Model } from 'src/app/codemirror/codemirror-sql/codemirror-sql.component';
import { ShortkeysComponent } from 'src/app/_general/components/shortkeys/shortkeys.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_protected/services/common/backend.service';

// CodeMirror options.
import sql from '../../../../../codemirror/options/sql.json';
import { CodemirrorActionsService } from '../../../hyper-ide/_services/codemirror-actions.service';
import { DefaultDatabaseType } from '../../../tools/database/_models/default-database-type.model';
import { SqlService } from '../../../tools/database/_services/sql.service';
import { SqlSnippetDialogComponent } from '../../../tools/endpoints/components/sql-snippet-dialog/sql-snippet-dialog.component';

@Component({
  selector: 'app-sql-view',
  templateUrl: './sql-view.component.html',
  styleUrls: ['./sql-view.component.scss']
})
export class SqlViewComponent implements OnInit {

  @Input() dbLoading: boolean;
  @Input() tables: any;
  @Input() databases: any;
  @Input() selectedDatabase: string = '';
  @Input() selectedDbType: string = '';
  @Input() selectedConnectionString: string = '';

  @Output() getDatabases: EventEmitter<any> = new EventEmitter<any>();

  /**
   * Input SQL component model and options.
   */
  input: Model = null;

  public canLoadSnippet: boolean = undefined;

  public queryResult: any = [];

  /**
   * Stores the query's data.
   */
   public dataSource: any = [];

   /**
    * Table columns to be displayed.
    */
   displayedColumns: any = [];

   columns: any = [];

  constructor(
    private dialog: MatDialog,
    private sqlService: SqlService,
    private backendService: BackendService,
    private generalService: GeneralService,
    private codemirrorActionsService: CodemirrorActionsService) { }

  ngOnInit(): void {
    (async () => {
      while (!(this.tables && this.tables.length))
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.tables && this.tables.length > 0) {
        this.canLoadSnippet = this.backendService.active?.access.sql.list_files;
        this.codemirrorInit();
        this.watchForActions();
      }
    })();
  }


  /*
   * Returns options for CodeMirror editor.
  */
  private getCodeMirrorOptions(): Promise<any> {
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
      tables: this.tables,
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
        this.sqlService.loadSnippet(this.selectedDbType, filename).subscribe({
          next: (content: string) => {
            this.input.sql = content;
          },
          error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
        })
      }
    });
  }

  public save() {console.log('save')}

  /**
   * Executes the current SQL towards your backend.
   */
  public execute() {
    if (this.input && this.input.editor) {
      const selectedText = this.input.editor.getSelection();
      this.sqlService.executeSql(
        this.selectedDbType,
        '[' + this.input.connectionString + '|' + this.selectedDatabase + ']',
        selectedText == '' ? this.input.sql : selectedText,
        true,
        false).subscribe({
          next: (result: any[][]) => {
            if (result) {
              let count = 0;
              for (var idx of result) {
                count += (idx || []).length;
              }
              if (count === 200) {
                this.generalService.showFeedback('First 200 records returned. Turn off safe mode to return all records.');
              } else {
                this.generalService.showFeedback(`${count} records returned`);
              }
            } else {
              this.generalService.showFeedback('SQL successfully executed, but returned no result');
            }
            this.queryResult = result || [];
            this.buildTable();

            // this.applyMigration(selectedText == '' ? this.input.sql : selectedText, true);
          },
          error: (error: any) => {
            if (error.error &&
              error.error.message &&
              error.error.message &&
              (<string>error.error.message).toLowerCase().indexOf('incorrect syntax near \'go\'') !== -1) {
              this.generalService.showFeedback('Turn ON batch mode to execute this SQL', 'errorMessage', 'Ok', 5000);
              return;
            }
            this.generalService.showFeedback(error.error.message ?? error, 'errorMessage', 'Ok', 5000);
          }
        });
    }
  }

  private buildTable() {
    if (this.queryResult && this.queryResult.length > 0) {

      const titles = Object.keys(this.queryResult[0][0]);
      if (titles.indexOf('password') > -1) {
        const index: number = titles.findIndex((value: string) => value === 'password');
        titles.splice(index,1)
      }

      for (const title of titles) {
        this.columns.push({
          columnDef: title,
          header: title
        });
      }
      this.displayedColumns = this.columns.map((c: any) => c.columnDef);
      this.dataSource = this.queryResult[0];
    }
  }

  public viewShortkeys() {
    this.dialog.open(ShortkeysComponent, {
      width: '500pc'
    })
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
}
