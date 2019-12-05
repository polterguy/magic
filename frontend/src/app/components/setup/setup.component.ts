
import { Component, OnInit } from '@angular/core';
import { MatSelectChange, MatSnackBar } from '@angular/material';
import { SetupService } from 'src/app/services/setup-service';

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

  constructor(
    private setupService: SetupService,
    private snackBar: MatSnackBar,) { }

  ngOnInit() {
  }

  databaseTypeChanged(e: MatSelectChange) {
    console.log(e.value);
  }

  setupAuthentication() {
    if (this.password !== this.passwordRepeat) {
      this.showError('Passwords are not matching');
      return;
    }
    this.setupService.setupAuthentication(this.selectedDatabaseType, this.username, this.password).subscribe(res => {
      console.log(res);
      this.showInfo('Congratulations, you have successfully secured your Magic installation.' +
        'Make sure you remember your new root password!');
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
