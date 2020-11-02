
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
    this.setupService.getAppSettingsJson().subscribe(obj => {
      obj.magic.license = this.license;
      this.setupService.saveAppSettingsJson(obj).subscribe(res => {
        this.snackBar.open('License successfully saved, wait 2 seconds while I refresh your information', 'ok', {
          duration: 5000,
        });
        setTimeout(() => {
          this.pingService.license().subscribe(res => {
            this.licenseInfo = res;
          });
        }, 2000);
      }, error => {
        this.snackBar.open(error.error.message, 'ok', {
          duration: 5000,
        });
      });
    }, error => {
      this.snackBar.open(error.error.message, 'ok', {
        duration: 5000,
      });
    });
  }
}
