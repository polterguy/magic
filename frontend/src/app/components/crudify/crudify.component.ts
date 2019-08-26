
import { Component, OnInit } from '@angular/core';
import { CrudifyService } from 'src/app/services/crudify-service';
import { MatSelectChange } from '@angular/material';

@Component({
  selector: 'app-crudify',
  templateUrl: './crudify.component.html',
  styleUrls: ['./crudify.component.scss']
})
export class CrudifyComponent implements OnInit {
  private displayedColumns: string[] = ['field', 'type', 'null', 'key', 'default'];
  private displayedColumnsEndpoints: string[] = ['endpoint', 'verb'];
  private databases: any[] = null;
  private selectedDatabase: string = null;
  private tables: any[] = null;
  private selectedTable: string = null;
  private columns: any[] = null;
  private endpoints: any[] = null;

  constructor(private service: CrudifyService) { }

  ngOnInit() {
    this.service.getDatabases().subscribe((res) => {
      this.databases = res;
    });
  }

  databaseChanged(e: MatSelectChange) {
    this.selectedDatabase = e.value;
    this.selectedTable = null;
    this.columns = null;
    this.service.getTables(this.selectedDatabase).subscribe((res) => {
      let tables = [];
      for (let idx = 0; idx < res.length; idx++) {
        tables.push({
          Table: res[idx][Object.keys(res[idx])[0]],
        });
      }
      this.tables = tables;
    });
  }

  tableChanged(e: MatSelectChange) {
    this.selectedTable = e.value;
    this.service.getColumns(this.selectedDatabase, this.selectedTable).subscribe((res) => {
      this.columns = res;
      this.createEndpoints();
    });
  }

  createEndpoints() {
    let endpoints = [];
    const verbs = ['get', 'post', 'put', 'delete'];
    for(let idx = 0; idx < verbs.length; idx++) {
      endpoints.push({
        endpoint: this.selectedDatabase + '/' + this.selectedTable,
        verb: verbs[idx],
      });
    }
    this.endpoints = endpoints;
  }

  generate() {
    console.log('generate');
  }
}
