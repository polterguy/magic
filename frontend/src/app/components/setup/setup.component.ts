
import { Component, OnInit } from '@angular/core';
import { MatSelectChange, MatSnackBar } from '@angular/material';
import { SqlService } from 'src/app/services/sql-service';

@Component({
  selector: 'app-evaluator',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit {

  private selectedDatabaseType: string = null;
  private databaseTypes: string[] = ['mysql', 'mssql'];
  private connectionString: string = null;

  constructor(
    private sqlService: SqlService,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
  }

  databaseTypeChanged(e: MatSelectChange) {
    console.log(e.value);
    this.sqlService.getConnectionString(e.value).subscribe(res => {
      this.connectionString = res;
      this.showInfo('Make sure you keep the "{database}" part as is, since it is replaced dynamically by Magic');
    });
  }

  showInfo(msg: string) {
    this.snackBar.open(msg, 'Close', {
      duration: 5000,
    });
  }
}
