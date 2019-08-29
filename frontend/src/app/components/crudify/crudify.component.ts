
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
    this.createDeleteHttpEndpoint();
  }

  private createDeleteHttpEndpoint() {
    console.log(this.columns);
    const ids = [];
    for (const iterator of this.columns) {
      if (iterator.Key === 'PRI') {
        const str = '{"' + iterator.Field + '": "' + iterator.Type + '"}';
        ids.push(JSON.parse(str));
      }
    }

    // TODO: Differentiate according to database type.
    const databaseType = 'mysql';
    this.crudService.generateCrudEndpoints({
      database: this.selectedDatabase,
      table: this.selectedTable,
      template: `/modules/system/templates/${databaseType}/crud.template.delete.hl`,
      verb: 'delete',
      templateArgs: ids,
    }).subscribe((res) => {
      console.log(res);
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
}
