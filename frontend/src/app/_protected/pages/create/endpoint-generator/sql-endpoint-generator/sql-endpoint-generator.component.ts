
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { ChangeDetectorRef, Component, Inject, LOCALE_ID, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Model } from 'src/app/codemirror/codemirror-sql/codemirror-sql.component';
import { ShortkeysComponent } from 'src/app/_general/components/shortkeys/shortkeys.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { CrudifyService } from '../../../../../_general/services/crudify.service';
import { TransformModelService } from '../../../../../_general/services/transform-model.service';
import { Argument } from '../../../manage/endpoints/_models/argument.model';
import { SqlService } from '../../../../../_general/services/sql.service';
import { AddArgumentDialogComponent } from './components/add-argument-dialog/add-argument-dialog.component';
import { SqlSnippetDialogComponent } from '../../sql-studio/components/sql-view/components/load-sql-snippet-dialog/load-sql-snippet-dialog.component';

// CodeMirror options.
import { CodemirrorActionsService } from '../../../../../_general/services/codemirror-actions.service';
import { SnippetNameDialogComponent } from 'src/app/_general/components/snippet-name-dialog/snippet-name-dialog.component';
import { MessageService } from 'src/app/_general/services/message.service';
import { GeneratorBase } from '../generator-base';
import { ActivatedRoute } from '@angular/router';
import { RoleService } from '../../../manage/user-and-roles/_services/role.service';

/**
 * SQL endpoint generator component, allowing user to create HTTP endpoints using SQL.
 */
@Component({
  selector: 'app-sql-endpoint-generator',
  templateUrl: './sql-endpoint-generator.component.html'
})
export class ManualGeneratorComponent extends GeneratorBase implements OnInit, OnDestroy {

  // Subscription for CodeMirror keyboard shortcut listener.
  private codemirrorActionsSubscription: Subscription;

  selectedRoles: FormControl = new FormControl<any>('');
  primaryURL: string = '';
  secondaryURL: string = 'custom-sql';
  hintTables: any = {};
  methods: string[] = Methods;
  selectedMethod: string = '';
  overwrite = false;
  arguments: Argument[] = [];
  waiting: boolean = false;
  sql: Model = {
    databaseType: this.selectedDbType,
    connectionString: this.selectedConnectionString,
    database: '[' + this.selectedConnectionString + '|' + this.selectedDatabase + ']',
    sql: '',
    options: [],
    editor: ''
  };

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private crudifyService: CrudifyService,
    private messageService: MessageService,
    protected generalService: GeneralService,
    protected sqlService: SqlService,
    protected roleService: RoleService,
    protected activatedRoute: ActivatedRoute,
    protected transformService: TransformModelService,
    private codemirrorActionsService: CodemirrorActionsService,
    @Inject(LOCALE_ID) public locale: string) {

      super(generalService, roleService, activatedRoute, sqlService);
    }

  ngOnInit() {

    this.getOptions();
    this.watchForActions();
    this.init();
  }

  changeDatabase() {

    const db = this.databases.find((item: any) => item.name === this.selectedDatabase);
    if (this.selectedDatabase && db && db.tables?.length) {
      const tables = this.databases.find((item: any) => item.name === this.selectedDatabase).tables;
      let hintTables = tables.map((x: any) => [x.name, x.columns.map((y: any) => y.name)]);
      this.hintTables = Object.fromEntries(hintTables);
      this.getOptions();
    }
    this.primaryURL = this.selectedDatabase.toLowerCase();
    this.cdr.detectChanges();
  }

  addArgument() {

    this.dialog.open(AddArgumentDialogComponent, {
      width: '500px',
      data: this.arguments
    }).afterClosed().subscribe((res: any) => {

      if (res) {
        this.arguments.push(res);
      }
    })
  }

  removeArgument(argument: Argument) {

    this.arguments.splice(this.arguments.indexOf(argument), 1);
  }

  loadSnippet() {

    this.dialog.open(SqlSnippetDialogComponent, {
      width: '550px',
      data: this.selectedDbType,
    }).afterClosed().subscribe((filename: string) => {

      if (filename) {

        this.generalService.showLoading();
        this.sqlService.loadSnippet(this.selectedDbType, filename).subscribe({
          next: (content: string) => {

            this.generalService.hideLoading();
            this.sql.sql = content;
          },
          error: (error: any) => {

            this.generalService.hideLoading();
            this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
          }
        })
      }
    });
  }

  generate() {

    const hasTables = this.databases.find((item: any) => item.name === this.selectedDatabase).tables !== null;
    if (!hasTables) {
      this.generalService.showFeedback('Please create tables in the selected database.', 'errorMessage', 'Ok', 5000);
      return;
    }
    if (this.primaryURL === '' && this.secondaryURL === '') {
      this.generalService.showFeedback('Please check URLs', 'errorMessage');
      return;
    }
    if (this.selectedMethod === '') {
      this.generalService.showFeedback('Please select an HTTP method', 'errorMessage');
      return;
    }
    if (this.sql.sql.trim() === '') {
      this.generalService.showFeedback('Please add some SQL', 'errorMessage');
      return;
    }
    this.generalService.showLoading();
    this.waiting = true;
    const data: any = {
      databaseType: this.selectedDbType,
      database: this.selectedDatabase,
      authorization: this.selectedRoles.value.toString(),
      moduleName: this.primaryURL,
      endpointName: this.secondaryURL,
      verb: this.selectedMethod,
      sql: this.sql.sql,
      arguments: this.getArguments(),
      overwrite: this.overwrite,
    }

    this.crudifyService.generateSqlEndpoint(data).subscribe({
      next: () => {

        this.generalService.showFeedback('SQL endpoint successfully created', 'successMessage');
        this.messageService.sendMessage({
          name: 'magic.folders.update',
          content: '/modules/'
        });
        this.generalService.hideLoading();
        this.waiting = false;
      },
      error: (error: any) => {

        this.generalService.hideLoading();
        this.waiting = false;
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 3000)
      }
    })
  }

  viewShortkeys() {

    this.dialog.open(ShortkeysComponent, {
      width: '900px',
      data: {
        type: ['save']
      }
    });
  }

  ngOnDestroy() {

    if (this.codemirrorActionsSubscription) {
      this.codemirrorActionsSubscription.unsubscribe();
    }
  }

  /*
   * Protected implementations of base class methods.
   */

  protected databaseLoaded() {
    this.changeDatabase();
    this.selectedRoles.setValue(['root', 'admin']);
  }

  /*
   * Private helper methods.
   */

  private getOptions() {

    const options = this.codemirrorActionsService.getActions('', 'sql');
    options.autofocus = false;
    options.hintOptions = {
      tables: this.hintTables,
    };
    this.sql.options = options;
  }

  private getArguments() {

    return this.arguments.map(x => x.name + ':' + x.type).join('\r\n');
  }

  private saveSnippet() {

    if (!this.sql?.sql || this.sql?.sql === '') {
      this.generalService.showFeedback('Write some SQL first, then save it', 'errorMessage')
      return;
    }

    this.dialog.open(SnippetNameDialogComponent, {
      width: '550px',
      data: ''
    }).afterClosed().subscribe((filename: string) => {

      if (filename) {

        this.generalService.showLoading();
        this.sqlService.saveSnippet(
          this.selectedDbType,
          filename,
          this.sql.sql).subscribe({
              next: () => {

                this.generalService.showFeedback('SQL snippet successfully saved.', 'successMessage');
                this.generalService.hideLoading();
              }, error: (error: any) => {

                this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 5000)
                this.generalService.hideLoading();
              }
            });
      }
    });
  }

  private watchForActions() {

    this.codemirrorActionsSubscription = this.codemirrorActionsService.action.subscribe((action: string) => {

      switch (action) {

        case 'save':
          this.saveSnippet();
          break;

        case 'insertSnippet':
          this.loadSnippet();
          break;

        default:
          break;
      }
    })
  }
}

const Methods: string[] = [
  'post',
  'get',
  'put',
  'delete',
  'patch',
];
