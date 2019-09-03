
import { Component, OnInit } from '@angular/core';
import { CrudifyService } from 'src/app/services/crudify-service';
import { MatSelectChange, MatSnackBar } from '@angular/material';
import { FileService } from 'src/app/services/file-service';
import { CrudifyResult } from 'src/app/models/endpoint-result-model';

@Component({
  selector: 'app-crudify',
  templateUrl: './crudify.component.html',
  styleUrls: ['./crudify.component.scss']
})
export class CrudifyComponent implements OnInit {
  private displayedColumns: string[] = ['field', 'type', 'null', 'key', 'default', 'extra'];
  private displayedColumnsEndpoints: string[] = ['endpoint', 'verb', 'action', 'auth'];
  private databases: any[] = null;
  private selectedDatabase: string = null;
  private tables: any[] = null;
  private selectedTable: string = null;
  private columns: any[] = null;
  private endpoints: any[] = null;
  private folderExists: boolean = false;
  private customSql: string;
  private verbs: string[] = ['get', 'post', 'put', 'delete'];
  private endpointName = '';
  private arguments: string;
  private selectedVerb = '';

  constructor(
    private crudService: CrudifyService,
    private fileService: FileService,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.crudService.getDatabases().subscribe((res) => {
      this.databases = res;
    }, (err) => {
      this.showError(err.error.message);
    });
  }

  getCodeMirrorOptions() {
    return {
      lineNumbers: true,
      theme: 'material',
      mode: 'text/x-mysql',
    };
  }

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
    this.selectedDatabase = e.value;
    this.tables = null;
    this.columns = null;
    this.endpoints = null;
    this.crudService.getTables(this.selectedDatabase).subscribe((res) => {
      const tables = [];
      tables.push({'table': 'Custom SQL'});
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
      this.selectedTable = e.value;
      this.customSql = 'select * from something';
      this.arguments = `arg1:int
arg2:string
arg3:date
arg4:decimal`;
    } else {
      this.selectedTable = e.value;
      this.crudService.getColumns(this.selectedDatabase, this.selectedTable).subscribe((res) => {
        this.columns = res;
        this.createEndpoints();
        this.fileService.folderExists('/modules/' + this.selectedDatabase).subscribe((res) => {
          if (res === true) {
            this.folderExists = true;
            this.showWarning('Warning, folder already exists!');
          } else {
            this.folderExists = false;
          }
        });
      }, (err) => {
        this.showError(err.error.message);
      });
    }
  }

  createEndpoints() {
    const endpoints = [];
    const verbs = [
      {verb: 'post', action: 'create'},
      {verb: 'get', action: 'read'},
      {verb: 'put', action: 'update'},
      {verb: 'delete', action: 'delete'},
    ];
    for (const iterator of verbs) {
      endpoints.push({
        endpoint: this.selectedDatabase + '/' + this.selectedTable,
        verb: iterator.verb,
        action: iterator.action,
        auth: 'root',
      });
    }
    this.endpoints = endpoints;
  }

  verbChanged(e: MatSelectChange) {
    this.selectedVerb = e.value;
  }

  generateSqlEndpoint() {
    if (this.customSql === '') {
      this.showError('No SQL provided');
      return;
    }
    if (this.endpointName === '') {
      this.showError('No endpoint name provided');
      return;
    }
    if (this.selectedVerb === '') {
      this.showError('No HTTP verb provided');
      return;
    }
    this.crudService.createCustomSqlEndpoint({
      database: this.selectedDatabase,
      arguments: this.arguments,
      verb: this.selectedVerb,
      endpointName: this.endpointName,
      sql: this.customSql,
    }).subscribe((res: CrudifyResult) => {
      console.log(res);
    }, (error) => {
      this.showError(error.error.message);
    });
  }

  generate() {
    this.createHttpEndpoint('get', (res: any) => {
      this.createHttpEndpoint('put', (res: any) => {
        this.createHttpEndpoint('post', (res: any) => {
          this.createHttpEndpoint('delete', (res: any) => {
            this.showSuccess('4 endpoints created successfully');
          });
        });
      });
    });
  }

  getAllPrimaryKeyColumns(namesOnly: boolean = false): any[] {
    const ids = [];
    for (const iterator of this.columns) {
      if (iterator.Key === 'pri') {
        if (namesOnly) {
          ids.push(iterator.Field);
        } else {
          const str = '{"' + iterator.Field + '": "' + iterator.Type + '"}';
          ids.push(JSON.parse(str));
        }
      }
    }
    return ids;
  }

  getAllNonPrimaryKeyColumns(): any[] {
    const ids = [];
    for (const iterator of this.columns) {
      if (iterator.Key !== 'pri') {
        const str = '{"' + iterator.Field + '": "' + iterator.Type + '"}';
        ids.push(JSON.parse(str));
      }
    }
    return ids;
  }

  getVerbAuthorization(verb: string) {
    return this.endpoints.filter((x) => x.verb == verb)[0].auth;
  }

  createHttpEndpoint(verb: string, callback: (res: any) => void) {
    const primary = this.getAllPrimaryKeyColumns();
    const columns = this.getAllNonPrimaryKeyColumns();
    const databaseType = 'mysql';
    const auth = this.getVerbAuthorization(verb);
    this.crudService.generateCrudEndpoints({
      database: this.selectedDatabase,
      table: this.selectedTable,
      template: `/modules/system/templates/${databaseType}/crud.template.${verb}.hl`,
      verb: verb,
      args: {
        primary,
        columns,
      },
      auth,
    }).subscribe((res) => {
      callback(res);
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

  showWarning(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 10000,
      panelClass: ['warning-snackbar'],
    });
  }

  showSuccess(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 10000,
    });
  }
}
