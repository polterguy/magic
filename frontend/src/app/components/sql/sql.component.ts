
import { Component, OnInit } from '@angular/core';
import { PipeTransform, Pipe } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { SqlService } from 'src/app/services/sql-service';

@Component({
  selector: 'app-sql',
  templateUrl: './sql.component.html',
  styleUrls: ['./sql.component.scss']
})
export class SqlComponent implements OnInit {
  private result: any = null;
  private databaseTypes = ['mysql', 'mssql'];
  private selectedDatabaseType = 'mysql';
  private sqlText = `/*
 * Type your SQL in here
 */
use some_database;
select * from some_table;`;

  constructor(
    private sqlService: SqlService,
    private snackBar: MatSnackBar) { }

  ngOnInit() { }

  getCodeMirrorOptions() {
    return {
      lineNumbers: true,
      theme: 'material',
      height: '250px',
      mode: 'text/x-mysql',
    };
  }

  evaluate() {
    this.sqlService.evaluate(this.sqlText, this.selectedDatabaseType).subscribe((res) => {
      this.result = res;
      this.showHttpSuccess('SQL executed successfully');
    }, (error) => {
      this.showHttpError(error);
    });
  }

  showHttpError(error: any) {
    this.snackBar.open(error.error.message, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }

  showHttpSuccess(msg: string) {
    this.snackBar.open(msg, 'Close', {
      duration: 2000,
    });
  }
}
