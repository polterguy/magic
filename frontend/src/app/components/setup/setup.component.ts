
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { SetupService } from 'src/app/services/setup-service';

@Component({
  selector: 'app-evaluator',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit {

  config: any = null;
  jwtSecret: string = null;
  databaseType: string = null;
  mssqlConnectionString: string = null;
  mysqlConnectionString: string = null;

  constructor(
    private setupService: SetupService,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.setupService.getAppSettingsJson().subscribe(res => {
      this.config = res;
      this.jwtSecret = this.config.magic.auth.secret;
      this.mssqlConnectionString = this.config.magic.databases.mssql.generic;
      this.mysqlConnectionString = this.config.magic.databases.mysql.generic;
    }, error => {
      this.showError(error.error.message);
    });
  }

  save() {
    this.config.magic.auth.secret = this.jwtSecret;
    this.config.magic.databases.mssql.generic = this.mssqlConnectionString;
    this.config.magic.databases.mysql.generic = this.mysqlConnectionString;
    this.setupService.saveAppSettingsJson(this.config).subscribe(res => {
      if (res.result.success === 'success') {}
    });
  }

  showError(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }

  showInfo(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 10000,
      panelClass: ['info-snackbar'],
    });
  }
}
