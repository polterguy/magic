
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { SetupService } from 'src/app/services/setup-service';
import { AuthenticateService } from 'src/app/services/authenticate-service';
import { Router } from '@angular/router';

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
  password: string = null;
  repeatPassword: string = null;
  hasShownSucces = false;

  constructor(
    private setupService: SetupService,
    private authService: AuthenticateService,
    private snackBar: MatSnackBar,
    private router: Router) { }

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

  checkConfig() {
    if (this.jwtSecret !== null &&
      this.jwtSecret.length >= 50 &&
      this.databaseType !== null &&
      this.password === this.repeatPassword &&
      this.password !== null) {
        if (!this.hasShownSucces) {
          this.hasShownSucces = true;
          this.showInfo('You can now save your configuration');
        }
        return true;
    }
    this.hasShownSucces = false;
    return false;
  }

  save() {
    this.config.magic.auth.secret = this.jwtSecret;
    this.config.magic.databases.mssql.generic = this.mssqlConnectionString;
    this.config.magic.databases.mysql.generic = this.mysqlConnectionString;
    this.setupService.saveAppSettingsJson(this.config).subscribe(res => {
      if (res.result === 'success') {
        this.authService.authenticate('root', this.password).subscribe(res2 => {
          this.showInfo('You have successfully secured your system');
          this.router.navigate(['']);
        }, err => {
          this.showError('Error, are you sure your connection string is correct?');
        });
      }
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
      duration: 2000,
      panelClass: ['info-snackbar'],
    });
  }
}
