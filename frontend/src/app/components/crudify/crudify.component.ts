
import { Component, OnInit } from '@angular/core';
import { CrudifyService } from 'src/app/services/crudify-service';
import { MatSelectChange, MatSnackBar } from '@angular/material';
import { FileService } from 'src/app/services/file-service';

@Component({
  selector: 'app-crudify',
  templateUrl: './crudify.component.html',
  styleUrls: ['./crudify.component.scss']
})
export class CrudifyComponent implements OnInit {
  private displayedColumns: string[] = ['field', 'type', 'null', 'key', 'default'];
  private displayedColumnsEndpoints: string[] = ['endpoint', 'verb', 'action', 'auth'];
  private databases: any[] = null;
  private selectedDatabase: string = null;
  private tables: any[] = null;
  private selectedTable: string = null;
  private columns: any[] = null;
  private endpoints: any[] = null;
  private folderExists: boolean = false;

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

  databaseChanged(e: MatSelectChange) {
    this.selectedDatabase = e.value;
    this.selectedTable = null;
    this.columns = null;
    this.endpoints = null;
    this.crudService.getTables(this.selectedDatabase).subscribe((res) => {
      const tables = [];
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

  generate() {
    this.createHttpGetEndpoint((res: any) => {
      this.createHttpPutEndpoint((res: any) => {
        this.createHttpPostEndpoint((res: any) => {
          this.createHttpDeleteEndpoint((res: any) => {
            this.showSuccess('All endpoints created successfully');
          });
        });
      });
    });
  }

  getAllPrimaryKeyColumns(namesOnly: boolean = false): any[] {
    const ids = [];
    for (const iterator of this.columns) {
      if (iterator.Key === 'PRI') {
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
      if (iterator.Key !== 'PRI') {
        const str = '{"' + iterator.Field + '": "' + iterator.Type + '"}';
        ids.push(JSON.parse(str));
      }
    }
    return ids;
  }

  createHttpGetEndpoint(callback: (res: any) => void) {
    const primary = this.getAllPrimaryKeyColumns();
    const columns = this.getAllNonPrimaryKeyColumns();
    this.createCrudTemplate(
      'get', {
        columns,
        primary,
      },
      callback);
  }

  createHttpPostEndpoint(callback: (res: any) => void) {
    const primary = this.getAllPrimaryKeyColumns();
    const columns = this.getAllNonPrimaryKeyColumns();
    this.createCrudTemplate(
      'post', {
        columns,
        primary,
      }, callback);
  }

  createHttpPutEndpoint(callback: (res: any) => void) {
    const primary = this.getAllPrimaryKeyColumns();
    const columns = this.getAllNonPrimaryKeyColumns();
    this.createCrudTemplate(
      'put', {
        columns,
        primary,
      }, callback);
  }

  createHttpDeleteEndpoint(callback: (res: any) => void) {
    const primary = this.getAllPrimaryKeyColumns(false);
    const columns = this.getAllNonPrimaryKeyColumns();
    this.createCrudTemplate(
      'delete', {
        columns,
        primary,
      }, callback);
  }

  createCrudTemplate(verb: string, args: any, callback: (res: any) => void) {
    const databaseType = 'mysql';
    this.crudService.generateCrudEndpoints({
      database: this.selectedDatabase,
      table: this.selectedTable,
      template: `/modules/system/templates/${databaseType}/crud.template.${verb}.hl`,
      verb: verb,
      args,
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
      panelClass: ['success-snackbar'],
    });
  }
}
