
import { Component, OnInit } from '@angular/core';
import { MatSelectChange, MatSnackBar } from '@angular/material';
import { SetupService } from 'src/app/services/setup-service';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-evaluator',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent {

  private selectedDatabaseType: string = null;
  private databaseTypes: string[] = ['mysql', 'mssql'];
  private username = 'root';
  private password: string = null;
  private passwordRepeat: string = null;

  constructor(
    private setupService: SetupService,
    private snackBar: MatSnackBar,
    private router: Router) { }

  databaseTypeChanged(e: MatSelectChange) {
    console.log(e.value);
  }

  setupAuthentication() {
    if (this.password !== this.passwordRepeat) {
      this.showError('Passwords are not matching');
      return;
    }
    if (this.password == null || this.password.length === 0) {
      this.showError('You must supply a password, and preferably a long and difficult to guess');
      return;
    }

    this.setupService.setupAuthentication(this.selectedDatabaseType, this.username, this.password).subscribe(res => {
      if (res.ticket) {
        localStorage.setItem('access_token', res.ticket);
        this.showInfo('New root user was created, and you are already logged in as it.');
      } else {
        localStorage.removeItem('access_token');
        this.showInfo('The root user already exists, hence you were logged out of system.');
      }
      environment.defaultAuth = false;
      this.router.navigate(['']);
    }, error => {
      this.showError(error.error.message);
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
