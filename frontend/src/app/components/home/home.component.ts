
import { Component, OnInit } from '@angular/core';
import { PingService } from 'src/app/services/ping-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SetupService } from 'src/app/services/setup-service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  public version: string;
  public licenseInfo: any = null;
  public license = '';
  public isFetching = false;

  constructor(
    private pingService: PingService,
    private snackBar: MatSnackBar,
    private setupService: SetupService) { }

  ngOnInit() {
    this.pingService.version().subscribe(res => {
      this.version = res.version;
    }, error => {
      this.snackBar.open(error.error.message || 'Something went wrong when trying to ping backend', 'Close');
    });
    this.pingService.license().subscribe(res => {
      this.licenseInfo = res;
    });
  }

  getVersion() {
    return this.version;
  }

  getLocalDate(date: string) {
    return new Date(date).toLocaleString();
  }

  saveLicense() {
    this.isFetching = true;
    this.setupService.saveLicense(this.license).subscribe(res => {
      this.snackBar.open('License was successfully saved', 'ok', {
        duration: 5000,
      });
      this.pingService.license().subscribe(res => {
        this.licenseInfo = res;
        this.isFetching = false;
      }, error => {
        this.snackBar.open(error.error.message, 'ok', {
          duration: 10000,
        });
        this.isFetching = true;
      });
    }, error => {
      this.snackBar.open(error.error.message, 'ok', {
        duration: 10000,
      });
    });
  }
}
