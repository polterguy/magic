
import { Component, OnInit } from '@angular/core';
import { MatSelectChange, MatSnackBar } from '@angular/material';
import { SetupService } from 'src/app/services/setup-service';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { PingService } from 'src/app/services/ping-service';
import { AuthenticateService } from 'src/app/services/authenticate-service';

@Component({
  selector: 'app-evaluator',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit {

  private selectedDatabaseType: string = null;
  private databaseTypes: string[] = ['mysql', 'mssql'];
  private username = 'root';
  private password: string = null;
  private passwordRepeat: string = null;
  private validDatabaseConnectionString = false;
  private appsettingsJson = '';
  private embarrassing = false;
  private changedSecret = false;

  constructor(
    private setupService: SetupService,
    private pingService: PingService,
    private snackBar: MatSnackBar,
    private router: Router,
    private authService: AuthenticateService) { }

  ngOnInit() {
    this.setupService.getAppSettingsJson().subscribe(res => {
      this.appsettingsJson = res;
    });
    this.pingService.ping().subscribe(res2 => {
      if (res2.warnings.jwt !== undefined) {
        this.showError('Please configure your Magic installation', 10000);
      } else {
        this.changedSecret = true;
      }
    });
  }

  databaseTypeChanged(e: MatSelectChange) {
    this.checkDatabaseConfiguration(this.selectedDatabaseType);
  }

  checkDatabaseConfiguration(databaseType: string) {
    this.setupService.checkDatabaseConfiguration(databaseType).subscribe(res => {
      this.validDatabaseConnectionString = true;
      this.showInfo('Choose a root password and click Setup');
    }, err => {
      this.validDatabaseConnectionString = false;
      this.showError('Provide a valid connection string, and save your appsettings.json file');
    });
  }

  setupAuthentication() {
    if (this.password !== this.passwordRepeat) {
      this.showError('Passwords are not matching');
      return;
    }
    if (this.password == null || this.password.length === 0) {
      this.showError('You must supply a root password');
      return;
    }

    this.setupService.setupAuthentication(this.selectedDatabaseType, this.username, this.password).subscribe(res => {
      localStorage.removeItem('access_token');
      this.showInfo('Magic has been successfully setup');
      environment.defaultAuth = false;
      this.router.navigate(['']);
    }, error => {
      this.showError(error.error.message);
      this.embarrassing = true;
    });
  }

  getCodeMirrorOptions() {
    return {
      lineNumbers: true,
      theme: 'material',
      mode: 'application/ld+json',
    };
  }

  saveConfigurationFile() {
    this.setupService.saveAppSettingsJson(this.appsettingsJson).subscribe(res => {
      setTimeout(() => {
        this.authService.authenticate('root', 'root').subscribe(res2 => {
          localStorage.setItem('access_token', res2.ticket);
          this.pingService.ping().subscribe(res3 => {
            if (res3.warnings !== undefined && res3.warnings !== null && res3.warnings.jwt !== undefined) {
              this.showError(res3.warnings.jwt, 10000);
            } else {
              this.changedSecret = true;
              environment.jwtIssues = false;
            }
          });
        }, error => {
          this.showError(error.error.message);
          localStorage.removeItem('access_token');
        });
      }, 1000);
    });
  }

  showError(error: string, duariont: number = 10000) {
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
