
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
      let tables = [];
      for (let idx = 0; idx < res.length; idx++) {
        tables.push({
          table: res[idx][Object.keys(res[idx])[0]],
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
          this.showError('Warning, folder already exists!');
        } else {
          this.folderExists = false;
        }
      });
    }, (err) => {
      this.showError(err.error.message);
    });
  }

  createEndpoints() {
    let endpoints = [];
    const verbs = [
      {verb: 'post', action: 'create'},
      {verb: 'get', action: 'read'},
      {verb: 'put', action: 'update'},
      {verb: 'delete', action: 'delete'},
    ];
    for(let idx = 0; idx < verbs.length; idx++) {
      endpoints.push({
        endpoint: this.selectedDatabase + '/' + this.selectedTable,
        verb: verbs[idx].verb,
        action: verbs[idx].action,
        auth: 'root',
      });
    }
    this.endpoints = endpoints;
  }

  generate() {
    console.log(this.endpoints);
  }

  showError(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }
}
