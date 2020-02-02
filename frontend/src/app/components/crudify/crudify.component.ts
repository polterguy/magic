
import { Component, OnInit } from '@angular/core';
import { CrudifyService } from 'src/app/services/crudify-service';
import { MatSelectChange, MatSnackBar, MatDialog } from '@angular/material';
import { CrudifyResult } from 'src/app/models/endpoint-result-model';
import { CreateValidatorDialogComponent } from './modals/create-validator-dialog';
import { Column } from 'src/app/models/column';

// A single column, and its meta information.
class ColumnModel {
  name: string;
  db: string;
  nullable: boolean;
  primary: boolean;
  automatic: boolean;
  hl: string;
  get: boolean;
  put: boolean;
  post: boolean;
  delete: boolean;
}

// A single verb, and its associated CRUD method.
class VerbModel {
  verb: string;
  action: string;
}

// A single validator, its field, and its content.
class ValidatorModel {
  field: string;
  validator: string;
}

// A single endpoint, and its associated data to be used during generating endpoint.
class EndpointModel {
  endpoint: string;
  verb: string;
  action: string;
  auth: string;
  generate: boolean;
  log: string;
}

class LogTables {
  name: string;
  columns: LogColumn[] = [];
}

class LogColumn {
  name: string;
}

@Component({
  selector: 'app-crudify',
  templateUrl: './crudify.component.html',
  styleUrls: ['./crudify.component.scss']
})
export class CrudifyComponent implements OnInit {

  // Columns declarations for our tables
  private displayedColumns: string[] = [
    'field',
    'type',
    'nullable',
    'primary',
    'automatic',
    'post',
    'get',
    'put',
    'delete'
  ];

  private displayedColumnsEndpoints: string[] = [
    'generate',
    'endpoint',
    'verb',
    'action',
    'log',
    'auth'
  ];

  private displayedColumnsValidators: string[] = [
    'field',
    'validator'
  ];

  private databaseTypes = ['mysql', 'mssql'];
  private publicCache = false;
  private moduleName = '';
  private defaultAuth = 'root';
  private moduleUrl = '';
  private databaseType = '';
  private databases: any[] = [];
  private tables: any[] = [];
  private selectedDatabase = '';
  private selectedTable = '';
  private caching: number;
  private columns: ColumnModel[] = [];
  private validators: ValidatorModel[] = [];
  private overwrite = false;
  isCrudifying = false;
  noEndpointsCreated = 0;
  noLoc = 0;
  currentlyCrudifying = '';

  // Endpoints that will be created
  private endpoints: EndpointModel[] = [];

  // Custom SQL that will be created, if any
  private customSql: string;

  // All verbs, and their CRUD associations
  private verbs: VerbModel[] = [
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
  private verbsNotGenerated: LogTables[] = [];
  private columnsNotEditable: LogTables[] = [];

  constructor(
    private crudService: CrudifyService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog) { }

  ngOnInit() { }

  databaseTypeChanged(e: MatSelectChange) {

    // User changes his active database type.
    this.databaseType = e.value;
    this.selectedDatabase = '';
    this.databases = [];
    this.tables = [];
    this.columns = [];
    this.validators = [];
    this.endpoints = [];
    this.selectedTable = '';
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
    this.selectedTable = '';
    this.overwrite = false;
    this.tables = [];
    this.columns = [];
    this.validators = [];
    this.endpoints = [];
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

  tableChanged(e: MatSelectChange) {
    this.setCurrentTable(e.value);
  }

  setCurrentTable(table: string) {

    if (table === 'Custom SQL') {

      // User wants to create a custom SQL endpoint
      this.selectedTable = table;
      this.customSql = 'select * from something';
      this.customSqlArguments = 'filter:string';

    } else if (table === 'All tables') {
      this.selectedTable = table;
    } else {

      // User wants to crudify a single table.
      this.selectedTable = table;
      this.setModuleUrl(table);
      this.crudService.getColumns(this.databaseType, this.selectedDatabase, this.selectedTable).subscribe(res => {
        this.columnsFetched(res);
      }, (err) => {
        this.showError(err.error.message);
      });
    }
  }

  getColumnCssClass(row: ColumnModel) {
    if (row.automatic && !row.primary) {
      if (row.post || row.put) {
        return 'fixed';
      }
      return 'warning-column';
    }
    return '';
  }

  // Builds our local data model by mapping from result from HTTP endpoint
  columnsFetched(res: Column[]) {

    // Creating our columns definition.
    this.columns = res.map(x => {
      const canCreate = x.db !== 'image' && x.db !== 'varbinary' && x.db !== 'binary' && x.db !== 'rowversion';
      const canView = x.db !== 'image' && x.db !== 'varbinary' && x.db !== 'binary';
      return {
        name: x.name,
        db: x.db,
        nullable: x.nullable,
        primary: x.primary,
        automatic: x.automatic,
        hl: x.hl,
        post: canCreate && !x.automatic,
        get: canView,
        put: x.primary || (!x.automatic && canCreate),
        delete: x.primary,
      };
    });

    // Figuring out what types of endpoints we should create for current table.
    const hasPrimaryKeys = this.columns.filter(x => x.primary).length > 0;
    const hasNonAutoPrimaryKeys = this.columns.filter(x => x.primary && !x.automatic).length > 0;
    const hasDataColumns = this.columns.filter(x => !x.primary).length > 0;
    const hasNonAutoDataColumns = this.columns.filter(x => !x.primary && !x.automatic).length > 0;

    const createGet = true;
    const createDelete = hasPrimaryKeys;
    const createPost = hasDataColumns || hasNonAutoPrimaryKeys;
    const createPut = hasPrimaryKeys && hasDataColumns && hasNonAutoDataColumns;

    this.endpoints = this.verbs.map(x => {
      return {
        endpoint: this.selectedDatabase + '/' + this.selectedTable,
        verb: x.verb,
        action: x.action,
        auth: this.defaultAuth,
        generate:
          (x.verb === 'post' && createPost) ||
          (x.verb === 'get' && createGet) ||
          (x.verb === 'put' && createPut) ||
          (x.verb === 'delete' && createDelete),
        log: '',
      };
    });

    // Checking if we're crudifying multiple tables, at which point we might have to generate some sort of log.
    if (this.isCrudifying) {

      // Checking if any verbs are not generated for some reasons.
      const notGenerated = this.endpoints.filter(x => !x.generate);
      if (notGenerated.length > 0 &&
        this.verbsNotGenerated.findIndex(x => x.name === this.selectedTable) === -1) {

        // Some endpoints are not generated for some reasons, making sure we log that fact.
        this.verbsNotGenerated.push({
          name: this.selectedTable,
          columns: notGenerated.map(x => {
            return {
              name: x.endpoint
            };
          })
        });
      }

      // Checking if we have automatic columns, that are not primary keys, and making sure we log these.
      const notSubmitted = this.columns.filter(x => x.automatic && !x.primary);
      if (notSubmitted.length > 0 && this.columnsNotEditable.findIndex(x => x.name === this.selectedTable) === -1) {
        this.columnsNotEditable.push({
          name: this.selectedTable,
          columns: notSubmitted.map(x => {
            return {
              name: x.name
            };
          })
        });
      }
    }

    // Creating our default input reactors, if any.
    this.validators = this.columns
      .filter(x => !x.automatic)
      .map(x => {
        return {
          field: x.name,
          validator: this.getDefaultValidator(x.name, this.selectedTable),
        };
    });
  }

  selectTable(table: string) {
    this.setCurrentTable(table);
  }

  getLogItemClass(el: string) {
    return this.selectedTable === el ? 'selected-log-item' : '';
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

  isVerbDisabled(verb: string) {
    return !this.endpoints.filter(x => x.verb === verb)[0].generate;
  }

  showCache() {
    return this.endpoints.filter(x => x.verb === 'get' && x.generate).length > 0;
  }

  showTransformers() {
    return this.endpoints.filter(x => (x.verb === 'post' && x.generate) || (x.verb === 'put' && x.generate)).length > 0;
  }

  getDefaultValidator(fieldName: string, tableName: string) {
    if (fieldName === 'password' && (tableName === 'dbo.users' || tableName === 'users')) {
      this.showSuccess('BlowFish was added to your password field, and it is not returned in GET endpoint');
      const password = this.columns.filter(x => x.name === 'password');
      password[0].get = false;

      // Also making sure we don't return password on HTTP GET endpoint.
      return `eval:x:+
slots.signal:transformers.hash-password
   reference:x:@.arguments/*/password`;
    }
    return '';
  }

  hasSelectedEndpoints() {
    return this.endpoints.filter(x => x.generate).length > 0;
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

    // Performing the actual crudification.
    const selectedVerbs = this.endpoints.filter(x => x.generate).map(x => x.verb);
    this.createHttpEndpoints(selectedVerbs, () => {
      let count = selectedVerbs.length;
      if (selectedVerbs.indexOf('get') > -1) {
        count += 1;
      }
      this.showSuccess(count + ' endpoints created successfully');
    });
  }

  closeLog() {
    this.verbsNotGenerated = [];
  }

  // Crudifies all tables in currently selected database.
  crudifyAllTables() {

    // Making sure we "obscure" the main visual area while CRUDifier is working.
    this.isCrudifying = true;
    this.noEndpointsCreated = 0;
    this.noLoc = 0;

    // Making sure we splice away "Custom SQL" and "All tables".
    this.crudifyTopTable(this.tables.slice(2));
  }

  crudifyTopTable(tables: any[]) {

    // Checking if we're done.
    if (tables.length === 0) {
      this.isCrudifying = false;
      this.selectedTable = 'All tables';
      this.columns = [];
      this.endpoints = [];
      this.overwrite = true;
      this.showSuccess(`${this.noEndpointsCreated} endpoints with a total of ${this.noLoc} ` +
        `lines of code created successfully. You might want to overwrite individual table endpoints for special cases now.`);
      return;
    }

    // Not done yet, continuing until we've got no more tables.
    const current = tables[0];
    this.currentlyCrudifying = current.table;
    this.selectedTable = this.currentlyCrudifying;
    this.setModuleUrl(this.selectedTable);
    this.crudService.getColumns(this.databaseType, this.selectedDatabase, current.table).subscribe((res) => {
      this.columnsFetched(res);
      const endpoints = this.endpoints.filter(x => x.generate).map(x => x.verb);
      this.createHttpEndpoints(endpoints, () => {
        this.noEndpointsCreated += endpoints.length;
        if (endpoints.indexOf('get') > -1) {
          this.noEndpointsCreated += 1;
        }
        this.crudifyTopTable(tables.splice(1));
      });
    }, (err) => {
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
    const curVerb = verbs[0];

    // This one decides if we should return primary key
    // Only relevant for POST / create endpoints.
    const returnId = curVerb === 'post' && this.columns
      .filter(x => x.primary && x.automatic).length > 0;

    // Constructing our arguments, according to which verb we're handling.
    const args: any = {};
    switch (curVerb) {

      case 'post':
        args.columns = this.columns.filter(x => x.post)
          .map(x => JSON.parse('{"' + x.name + '": "' + x.hl + '"}'));
        break;

      case 'get':
        args.columns = this.columns.filter(x => x.get)
          .map(x => JSON.parse('{"' + x.name + '": "' + x.hl + '"}'));
        break;

      case 'put':
        args.primary = this.columns.filter(x => x.put && x.primary)
          .map(x => JSON.parse('{"' + x.name + '": "' + x.hl + '"}'));
        args.columns = this.columns.filter(x => x.put && !x.primary)
          .map(x => JSON.parse('{"' + x.name + '": "' + x.hl + '"}'));
        break;

      case 'delete':
        args.primary = this.columns.filter(x => x.delete)
          .map(x => JSON.parse('{"' + x.name + '": "' + x.hl + '"}'));
        break;

    }

    // Figuring out validators, only relevant to POST and PUT.
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

    // Invoking HTTP service that actually creates our backend endpoint.
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
      overwrite: this.overwrite
    }).subscribe((res: any) => {
      this.noLoc += res.loc;
      this.createHttpEndpoints(verbs.slice(1), callback);
    }, (error) => {
      if (this.isCrudifying) {
        this.selectedTable = 'All tables';
        this.endpoints = [];
        this.columns = [];
      }
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
