import { ChangeDetectorRef, Component, EventEmitter, Inject, Input, LOCALE_ID, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subscription } from 'rxjs';
import { Model } from 'src/app/codemirror/codemirror-sql/codemirror-sql.component';
import { BackendService } from 'src/app/services/backend.service';
import { CacheService } from 'src/app/services/cache.service';
import { MessageService } from 'src/app/services/message.service';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';
import { ShortkeysComponent } from 'src/app/_general/components/shortkeys/shortkeys.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { CrudifyService } from '../../../crud-generator/_services/crudify.service';
import { TransformModelService } from '../../../crud-generator/_services/transform-model.service';
import { Argument } from '../../../administration/generated-endpoints/_models/argument.model';
import { LogService } from '../../../log/_services/log.service';
import { Role } from '../../../user-roles/_models/role.model';
import { SqlService } from '../../database/_services/sql.service';
import { AddArgumentDialogComponent } from '../components/add-argument-dialog/add-argument-dialog.component';
import { SqlSnippetDialogComponent } from '../components/sql-snippet-dialog/sql-snippet-dialog.component';

// CodeMirror options.
import sql from '../../../../../codemirror/options/sql.json';

@Component({
  selector: 'app-manual-generator',
  templateUrl: './manual-generator.component.html',
  styleUrls: ['./manual-generator.component.scss']
})
export class ManualGeneratorComponent implements OnInit, OnDestroy {

  @Input() dbLoading: Observable<boolean>;
  @Input() databases: any = [];
  @Input() databaseTypes: any = [];
  @Input() connectionStrings: any = [];
  @Input() roles: Role[] = [];

  @Input() defaultDbType: string = '';
  @Input() defaultConnectionString: string = '';
  @Input() defaultDbName: string = '';

  public allDatabasesList: any = [];
  public selectedDatabase: string = '';
  public selectedDbType: string = '';
  public selectedConnectionString: string = '';
  public selectedTables: FormControl = new FormControl<any>('');
  public selectedRoles: FormControl = new FormControl<any>('');
  public primaryURL: string = '';
  public secondaryURL: string = 'custom-sql';
  public logCreate: boolean = false;
  public logUpdate: boolean = false;
  public logDelete: boolean = false;

  public tables: any = [];

  @Output() getConnectionString: EventEmitter<any> = new EventEmitter<any>();

  private dbLoadingSubscription!: Subscription;

  @ViewChild('urlName', { static: true }) private urlName: HTMLElement;

  public CommonRegEx = CommonRegEx;
  public CommonErrorMessages = CommonErrorMessages;

  /**
   * Verbs user can select from.
   */
  public methods: string[] = Methods;

  public selectedMethod: string = '';

  /**
   * Whether or not endpoint returns a list of items or a single item.
   */
  public isScalar = false;

   /**
    * Whether or not existing endpoints should be overwritten or not.
    */
  public overwrite = false;

  /**
   * List of arguments endpoint can handle.
   */
  public arguments: Argument[] = [];

  public sqlInput: string = '';

  public canLoadSnippet: boolean = undefined;

  public waiting: boolean = false;

  /**
   * Input SQL component model and options.
   */
  public sql: Model = {
    databaseType: this.selectedDbType,
    connectionString: this.selectedConnectionString,
    database: '[' + this.selectedConnectionString + '|' + this.selectedDatabase + ']',
    sql: '',
    options: sql,
    editor: ''
  };

  constructor(
    private dialog: MatDialog,
    private logService: LogService,
    private cdr: ChangeDetectorRef,
    private crudifyService: CrudifyService,
    private messageService: MessageService,
    private generalService: GeneralService,
    private sqlService: SqlService,
    private backendService: BackendService,
    protected transformService: TransformModelService,
    @Inject(LOCALE_ID) public locale: string) { }

  ngOnInit(): void {
    this.watchDbLoading();
  }

  private watchDbLoading() {
    this.dbLoadingSubscription = this.dbLoading.subscribe((isLoading: boolean) => {
      this.selectedDatabase = '';
      this.selectedConnectionString = '';
      this.tables = [];
      if (isLoading === false) {

        this.waitingData();
      }
    })
  }

  private waitingData() {
    (async () => {
      while (!(this.databaseTypes && this.databaseTypes.length && this.defaultConnectionString && this.defaultConnectionString !== '' && this.databases && this.databases.length))
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.databaseTypes && this.databaseTypes.length > 0 && this.defaultConnectionString && this.defaultConnectionString !== '' && this.databases && this.databases.length > 0) {

        this.allDatabasesList = [...this.databases];

        this.selectedDbType = this.defaultDbType;
        this.selectedConnectionString = this.defaultConnectionString;
        this.selectedDatabase = this.defaultDbName !== '' ? this.defaultDbName : this.databases[0].name;
        this.primaryURL = this.selectedDatabase.toLowerCase();

        this.selectedRoles.setValue(['root', 'guest']);

        this.canLoadSnippet = this.backendService.active?.access.sql.list_files;

        this.changeDatabase();
        this.cdr.detectChanges();
      }
    })();
  }

  public changeConnectionStrings() {
    this.getConnectionString.emit({ selectedDbType: this.selectedDbType, selectedConnectionString: this.selectedConnectionString });
  }

  public changeDatabase() {
    const db = this.databases.find((item: any) => item.name === this.selectedDatabase);
    if (this.selectedDatabase && db && db.tables?.length) {
      this.tables = this.databases.find((item: any) => item.name === this.selectedDatabase).tables;
      let names: any = this.tables.map((item: any) => { return item.name });
      this.selectedTables = new FormControl({value: names, disabled: false});
    } else {
      this.selectedTables = new FormControl({value: '', disabled: true});
    }
    this.primaryURL = this.selectedDatabase.toLowerCase();
    this.cdr.detectChanges();
  }

  public generateEndpoints() {}
  public addArgument() {
    this.dialog.open(AddArgumentDialogComponent, {
      width: '500px',
      data: this.arguments
    }).afterClosed().subscribe((res: any) => {
      if (res) {
        this.arguments.push(res);
      }
    })
  }

  /**
   * Returns the string (Hyperlambda) representation of declared arguments.
   */
  private getArguments() {
    return this.arguments.map(x => x.name + ':' + x.type).join('\r\n');
  }

  /**
   * Invoked when user wants to remove an argument from collection of arguments
   * endpoint can handle.
   *
   * @param argument Argument to remove
   */
  public removeArgument(argument: Argument) {
    this.arguments.splice(this.arguments.indexOf(argument), 1);
  }

  private validateUrlName() {
    return this.CommonRegEx.appNames.test(this.primaryURL) && this.CommonRegEx.appNames.test(this.secondaryURL);
  }

  /**
   * Opens the load snippet dialog, to allow user to select a previously saved snippet.
   */
   loadSnippet() {
    const dialogRef = this.dialog.open(SqlSnippetDialogComponent, {
      width: '550px',
      data: this.selectedDbType,
    });
    dialogRef.afterClosed().subscribe((filename: string) => {
      if (filename) {
        this.sqlService.loadSnippet(this.selectedDbType, filename).subscribe({
          next: (content: string) => {
            this.sql.sql = content;
          },
          error: (error: any) => this.generalService.showFeedback(error, 'errorMessage')
        })
      }
    });
  }

  /**
   * Generates your SQL endpoint.
   */
   generate() {
    const hasTables = this.databases.find((item: any) => item.name === this.selectedDatabase).tables !== null;
    if (!hasTables) {
      this.generalService.showFeedback('Please create tables in the selected database.', 'errorMessage', 'Ok', 5000);
      return;
    }
    if (!this.validateUrlName() || this.primaryURL === '' && this.secondaryURL === '') {
      this.generalService.showFeedback('Please check the route(s).', 'errorMessage');
      return;
    }
    if (this.selectedMethod === '') {
      this.generalService.showFeedback('Please select a method.', 'errorMessage');
      return;
    }
    if (this.selectedRoles.value.length === 0) {
      this.generalService.showFeedback('Please select role(s).', 'errorMessage');
      return;
    }
    if (this.sql.sql.trim() === '') {
      this.generalService.showFeedback('Did you forget to add your code?', 'errorMessage');
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
      isList: !this.isScalar
    }

    this.crudifyService.generateSqlEndpoint(data).subscribe({
      next: (res: any) => {
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
        this.generalService.showFeedback(error, 'errorMessage', 'Ok', 3000)
      }
    })
  }

  public viewShortkeys() {
    this.dialog.open(ShortkeysComponent, {
      width: '500pc'
    })
  }

  ngOnDestroy(): void {
    if (this.dbLoadingSubscription) {
      this.dbLoadingSubscription.unsubscribe();
    }
  }
}


const Methods: string[] = [
  'post',
  'get',
  'put',
  'delete',
  'patch',
];
