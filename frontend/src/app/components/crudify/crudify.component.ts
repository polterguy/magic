
import { Component, OnInit } from '@angular/core';
import { CrudifyService } from 'src/app/services/crudify-service';
import { MatSelectChange, MatSnackBar, MatDialog } from '@angular/material';
import { CrudifyResult } from 'src/app/models/endpoint-result-model';
import { CreateValidatorDialogComponent } from './modals/create-validator-dialog';

@Component({
  selector: 'app-crudify',
  templateUrl: './crudify.component.html',
  styleUrls: ['./crudify.component.scss']
})
export class CrudifyComponent implements OnInit {

  // Columns declarations for our tables
  private displayedColumns: string[] = ['field', 'type', 'nullable', 'primary', 'automatic'];
  private displayedColumnsEndpoints: string[] = ['generate', 'endpoint', 'verb', 'action', 'log', 'auth'];
  private displayedColumnsValidators: string[] = ['field', 'validator'];
  private publicCache = false;

  // Databases, tables, and selected instances of such.
  private databaseTypes = ['mysql', 'mssql'];
  private moduleName: string = null;
  private moduleUrl: string = null;
  private databaseType: string;
  private databases: any[] = null;
  private tables: any[] = null;
  private selectedDatabase: string = null;
  private selectedTable: string = null;
  private caching: number;
  private columns: any[] = null;
  private validators: any[] = null;
  private overwrite = false;

  // True while we're CRUDifying.
  isCrudifying = false;
  noEndpointsCreated = 0;
  noLoc = 0;
  currentlyCrudifying: string;

  // Endpoints that will be created
  private endpoints: any[] = null;

  // Custom SQL that will be created, if any
  private customSql: string;

  // All verbs, and their CRUD associations
  private verbs = [
    {verb: 'post', action: 'create'},
    {verb: 'get', action: 'read'},
    {verb: 'put', action: 'update'},
    {verb: 'delete', action: 'delete'},
  ];

  // Name of endpoint, arguments and HTTP verb for custom SQL
  private customSqlEndpointName = '';
  private customSqlArguments: string;
  private customSqlEndpointVerb = '';
  private customSqlAuthorization = 'root';

  constructor(
    private crudService: CrudifyService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog) { }

  ngOnInit() { }

  databaseTypeChanged(e: MatSelectChange) {

    // User changes his active database type.
    this.databaseType = e.value;
    this.selectedDatabase = null;
    this.databases = null;
    this.tables = null;
    this.columns = null;
    this.validators = null;
    this.endpoints = null;
    this.selectedTable = null;
    this.getDatabases();
  }

  getDatabases() {
    this.crudService.getDatabases(this.databaseType).subscribe((res) => {
      this.databases = res || [];
      if (this.databases.length === 0) {
        this.showError('You don\'t have any databases in your installation, please create one using e.g. the SQL menu');
      }
    }, (err) => {
      this.showError(err.error.message);
    });
  }

  // Returns options for CodeMirror for its SQL instance in "Custom SQL" creation mode
  getCodeMirrorOptionsSql() {
    return {
      lineNumbers: true,
      theme: 'material',
      mode: 'text/x-mysql',
    };
  }

  // Returns CodeMirror options for Hyperlambda mode
  getCodeMirrorOptionsHyperlambda() {
    return {
      lineNumbers: true,
      theme: 'material',
      mode: 'hyperlambda',
      tabSize: 3,
      indentUnit: 3,
      indentAuto: true,
      extraKeys: {
        'Shift-Tab': 'indentLess',
        Tab: 'indentMore'
      }
    };
  }

  databaseChanged(e: MatSelectChange) {

    // User changes his active database
    this.selectedDatabase = e.value;
    this.tables = null;
    this.columns = null;
    this.validators = null;
    this.endpoints = null;
    this.moduleName = e.value;

    // Getting tables for his new database of choice
    this.crudService.getTables(this.databaseType, this.selectedDatabase).subscribe((res) => {

      // Making sure we append "Custom SQL" as first option in select
      const tables = [{table: 'Custom SQL'}, {table: 'All tables'}];

      // Appending all tables as option in select for selecting table
      for (const iterator of res) {
        tables.push({
          table: iterator[Object.keys(iterator)[0]],
        });
      }
      this.tables = tables;
    }, (err) => {
      this.showError(err.error.message);
    });
  }

  setModuleUrl(value: string) {
    switch (value) {
      case 'dbo.users':
      case 'dbo.roles':
      case 'dbo.users_roles':
        this.moduleUrl = value.substring(4);
        break;
      default:
        this.moduleUrl = value;
        break;
    }
  }

  tableChanged(e: MatSelectChange) {

    if (e.value === 'Custom SQL') {

      // User wants to create a custom SQL endpoint
      this.selectedTable = e.value;
      this.customSql = 'select * from something';
      this.customSqlArguments = 'filter:string';

    } else if (e.value === 'All tables') {
      this.selectedTable = e.value;
    } else {

      // User wants to crudify a table.
      // Special cases for "auth crudification".
      this.setModuleUrl(e.value);
      this.selectedTable = e.value;
      this.crudService.getColumns(this.databaseType, this.selectedDatabase, this.selectedTable).subscribe((res) => {
        this.columns = res;
        this.endpoints = this.verbs.map(x => {
          return {
            endpoint: this.selectedDatabase + '/' + this.selectedTable,
            verb: x.verb,
            action: x.action,
            auth: 'root',
            generate: true,
            log: ''
          };
        });
        this.validators = this.columns
          .filter(x => !x.automatic)
          .map(x => {
            return {
              field: x.name,
              validator: this.getDefaultValidator(x.name, this.selectedTable),
            };
        });
      }, (err) => {
        this.showError(err.error.message);
      });
    }
  }

  getDefaultValidator(fieldName: string, tableName: string) {
    if (fieldName === 'password' && (tableName === 'dbo.users' || tableName === 'users')) {
      this.showSuccess('Notice! BlowFish hashing was automatically added to your password field!');
      return `eval:x:+
slots.signal:transformers.hash-password
   reference:x:@.arguments/*/password`;
    }
    return '';
  }

  addValidator(el: any) {
    const dialogRef = this.dialog.open(CreateValidatorDialogComponent, {
      width: '700px',
      data: {
        field: el.field,
        hyperlambda: el.validator,
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== undefined) {
        if (el.validator === null || el.validator === undefined || el.validator === '') {
          el.validator = res.hyperlambda;
        } else {
          el.validator += '\r\n' + res.hyperlambda;
        }
        this.showSuccess('You might have to further parametrize your validator');
      }
    });
  }

  getCodeMirrorOptionsValidators() {
    return {
      lineNumbers: true,
      theme: 'material',
      mode: 'hyperlambda',
      tabSize: 3,
      indentUnit: 3,
      indentAuto: true,
      extraKeys: {
        'Shift-Tab': 'indentLess',
        Tab: 'indentMore',
        'Ctrl-Space': 'autocomplete',
      }
    };
  }

  // Invoked when user wants to create a Custom SQL endpoint
  // As in user clicks the button to create endpoint
  generateSqlEndpoint() {

    // Sanity checking data first
    if (this.customSql === '') {
      this.showError('No SQL provided');
      return;
    }
    if (this.customSqlEndpointName === '') {
      this.showError('No endpoint name provided');
      return;
    }
    if (this.customSqlEndpointVerb === '') {
      this.showError('No HTTP verb provided');
      return;
    }

    // Creating custom SQL endpoint
    this.crudService.createCustomSqlEndpoint({
      databaseType: this.databaseType,
      database: this.selectedDatabase,
      arguments: this.customSqlArguments,
      verb: this.customSqlEndpointVerb,
      endpointName: this.customSqlEndpointName,
      sql: this.customSql,
      authorization: this.customSqlAuthorization,
      overwrite: this.overwrite,
    }).subscribe((res: CrudifyResult) => {
      this.showSuccess('Endpoint successfully created');
    }, (error) => {
      this.showError(error.error.message);
    });
  }

  // Crudifies a single table in some database.
  crudifyTable() {
    const selectedVerbs = this.endpoints.filter(x => x.generate).map(x => x.verb);
    this.createHttpEndpoints(selectedVerbs, () => {
      this.showSuccess(selectedVerbs.length + ' endpoints created successfully');
    });
  }

  // Crudifies ALL tables in currently selected database.
  crudifyAllTables() {

    // Making sure user has chosen a module name.
    if (this.moduleName === '' || this.moduleName === null || this.moduleName === undefined) {
      this.showError('You have to supply a module name for me');
      return;
    }

    // Making sure we "obscur" the main visual area while CRUDifier is working.
    this.isCrudifying = true;
    this.noEndpointsCreated = 0;
    this.noLoc = 0;

    // Making sure we splice away "Custom SQL" and "All tables".
    this.crudifyTopTable(this.tables.splice(2));
  }

  crudifyTopTable(tables: any[]) {

    // Checking if we're done.
    if (tables.length === 0) {
      this.isCrudifying = false;
      this.moduleName = null;
      this.selectedDatabase = null;
      this.databases = null;
      this.tables = null;
      this.columns = null;
      this.endpoints = null;
      this.selectedTable = null;
      this.getDatabases();
      this.showSuccess(`${this.noEndpointsCreated} endpoints with a total of ${this.noLoc} lines of code created successfully`);
      return;
    }
    const current = tables[0];
    this.currentlyCrudifying = current.table;
    this.selectedTable = this.currentlyCrudifying;
    this.setModuleUrl(this.selectedTable);
    this.crudService.getColumns(this.databaseType, this.selectedDatabase, current.table).subscribe((res) => {
      this.columns = res;
      this.endpoints = this.verbs.map(x => {
        return {
          endpoint: this.selectedDatabase + '/' + this.selectedTable,
          verb: x.verb,
          action: x.action,
          auth: 'root',
          generate: true
        };
      });
      this.validators = this.columns
        .filter(x => !x.automatic)
        .map(x => {
          return {
            field: x.name,
            validator: this.getDefaultValidator(x.name, this.selectedTable),
          };
        });
      this.createHttpEndpoints(['get', 'post', 'put', 'delete'], () => {
        this.noEndpointsCreated += 4;
        this.crudifyTopTable(tables.splice(1));
      });
    }, (err) => {
      this.moduleName = null;
      this.selectedDatabase = null;
      this.databases = null;
      this.tables = null;
      this.columns = null;
      this.endpoints = null;
      this.selectedTable = null;
      this.getDatabases();
      this.isCrudifying = false;
      this.showError(err.error.message);
    });
}

  // Helper method that creates one single HTTP endpoint
  createHttpEndpoints(verbs: string[], callback: () => void) {

    // Checking if we're done
    if (verbs.length === 0) {
      callback();
      return;
    }
    if (this.moduleUrl === null || this.moduleUrl === '' || this.moduleUrl === undefined) {
      this.showError('No module URL supplied to crudification process');
      return;
    }
    const curVerb = verbs[0];

    // Contains arguments to crudifier
    const args: any = {};
    let returnId = true;

    // Figuring out which arguments to pass in, which depends upon HTTP verb we're
    // currently crudifying.
    if (curVerb === 'put' || curVerb === 'delete') {
      args.primary = this.columns
        .filter(x => x.primary)
        .map(x => JSON.parse('{"' + x.name + '": "' + x.hl + '"}'));
    }
    if (curVerb === 'put') {
      args.columns = this.columns
        .filter(x => !x.primary)
        .map(x => JSON.parse('{"' + x.name + '": "' + x.hl + '"}'));
    }
    if (curVerb === 'post') {
      returnId = this.columns.filter(x => x.primary === true && x.automatic === true).length > 0;
      args.columns = this.columns
        .filter(x => !x.automatic)
        .map(x => JSON.parse('{"' + x.name + '": "' + x.hl + '"}'));
    }
    if (curVerb === 'get') {
      args.cache = this.caching;
      args.columns = this.columns
        .map(x => JSON.parse('{"' + x.name + '": "' + x.hl + '"}'));
      args.publicCache = this.publicCache;
    }

    let validators = '';
    if (curVerb === 'post' || curVerb === 'put') {
      if (this.validators !== null && this.validators !== undefined && this.validators.length > 0) {
        for (const idx of this.validators) {
          if (idx.validator !== null && idx.validator !== undefined) {
            validators += idx.validator + '\r\n';
          }
        }
      }
    }
    this.crudService.generateCrudEndpoints(this.databaseType, {
      databaseType: this.databaseType,
      moduleName: this.moduleName,
      database: this.selectedDatabase,
      table: this.selectedTable,
      moduleUrl: this.moduleUrl,
      returnId,
      template: `/modules/system/crudifier/templates/crud.template.${curVerb}.hl`,
      verb: curVerb,
      auth: this.endpoints.filter((x) => x.verb === curVerb)[0].auth,
      log: this.endpoints.filter((x) => x.verb === curVerb)[0].log,
      args,
      validators,
      overwrite: this.overwrite,
    }).subscribe((res: any) => {
      this.noLoc += res.loc;
      this.createHttpEndpoints(verbs.slice(1), callback);
    }, (error) => {
      this.moduleName = null;
      this.selectedDatabase = null;
      this.databases = null;
      this.tables = null;
      this.columns = null;
      this.endpoints = null;
      this.selectedTable = null;
      this.getDatabases();
      this.isCrudifying = false;
      this.showError(error.error.message);
    });
  }

  showError(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }

  showSuccess(msg: string) {
    this.snackBar.open(msg, 'Close', {
      duration: 5000,
    });
  }
}
