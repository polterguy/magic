
import { Component, OnInit } from '@angular/core';
import { CrudifyService } from 'src/app/services/crudify-service';
import { MatSelectChange, MatSnackBar } from '@angular/material';
import { CrudifyResult } from 'src/app/models/endpoint-result-model';

@Component({
  selector: 'app-crudify',
  templateUrl: './crudify.component.html',
  styleUrls: ['./crudify.component.scss']
})
export class CrudifyComponent implements OnInit {

  // Columns declarations for our tables
  private displayedColumns: string[] = ['field', 'type', 'nullable', 'primary', 'automatic'];
  private displayedColumnsEndpoints: string[] = ['generate', 'endpoint', 'verb', 'action', 'auth'];

  // Databases, tables, and selected instances of such.
  private databaseTypes = ['mysql', 'mssql'];
  private databaseType: string;
  private databases: any[] = null;
  private tables: any[] = null;
  private selectedDatabase: string = null;
  private selectedTable: string = null;

  // All columns in table
  private columns: any[] = null;

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
    private snackBar: MatSnackBar) { }

  ngOnInit() { }

  databaseTypeChanged(e: MatSelectChange) {

    // User changes his active database type.
    this.databaseType = e.value;
    this.selectedDatabase = null;
    this.databases= null;
    this.tables = null;
    this.columns = null;
    this.endpoints = null;
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
    this.endpoints = null;

    // Getting tables for his new database of choice
    this.crudService.getTables(this.databaseType, this.selectedDatabase).subscribe((res) => {

      // Making sure we append "Custom SQL" as first option in select
      const tables = [{table: 'Custom SQL'}];

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

    if (e.value === 'Custom SQL') {

      // User wants to create a custom SQL endpoint
      this.selectedTable = e.value;
      this.customSql = 'select * from something';
      this.customSqlArguments = 'filter:string';

    } else {

      // User wants to crudify a table.
      this.selectedTable = e.value;
      this.crudService.getColumns(this.databaseType, this.selectedDatabase, this.selectedTable).subscribe((res) => {
        this.columns = res;
        this.endpoints = this.verbs.map(x => {
          return {
            endpoint: this.selectedDatabase + '/' + this.selectedTable,
            verb: x.verb,
            action: x.action,
            auth: 'root',
            generate: true
          }
        });
      }, (err) => {
        this.showError(err.error.message);
      });
    }
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
    this.crudService.createCustomSqlEndpoint(this.databaseType, {
      database: this.selectedDatabase,
      arguments: this.customSqlArguments,
      verb: this.customSqlEndpointVerb,
      endpointName: this.customSqlEndpointName,
      sql: this.customSql,
      authorization: this.customSqlAuthorization,
    }).subscribe((res: CrudifyResult) => {
      this.showSuccess('Endpoint successfully created');
    }, (error) => {
      this.showError(error.error.message);
    });
  }

  // Crudifies a table in some database
  crudifyTable() {
    const selectedVerbs = this.endpoints.filter(x => x.generate).map(x => x.verb);
    this.createHttpEndpoints(selectedVerbs, () => {
      this.showSuccess('4 endpoints created successfully');
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

    // Contains arguments to crudifier
    const args = {};

    // Figuring out which arguments to pass in, which depends upon HTTP verb we're
    // currently crudifying.
    if (curVerb === 'put' || curVerb === 'delete') {
      args['primary'] = this.columns
        .filter(x => x.primary)
        .map(x => JSON.parse('{"' + x.name + '": "' + x.hl + '"}'));
    }
    if (curVerb === 'put') {
      args['columns'] = this.columns
        .filter(x => !x.primary)
        .map(x => JSON.parse('{"' + x.name + '": "' + x.hl + '"}'));
    }
    if (curVerb === 'post') {
      args['columns'] = this.columns
        .filter(x => !x.automatic)
        .map(x => JSON.parse('{"' + x.name + '": "' + x.hl + '"}'));
    }
    if (curVerb === 'get') {
      args['columns'] = this.columns
        .map(x => JSON.parse('{"' + x.name + '": "' + x.hl + '"}'));
    }

    // Database type
    this.crudService.generateCrudEndpoints(this.databaseType, {
      database: this.selectedDatabase,
      table: this.selectedTable,
      template: `/modules/${this.databaseType}/templates/crud.template.${curVerb}.hl`,
      verb: curVerb,
      auth: this.endpoints.filter((x) => x.verb === curVerb)[0].auth,
      args,
    }).subscribe((res) => {
      this.createHttpEndpoints(verbs.slice(1), callback);
    }, (error) => {
      this.showError(error.error.message);
    });
  }

  showError(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }

  showSuccess(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 2000,
    });
  }
}
