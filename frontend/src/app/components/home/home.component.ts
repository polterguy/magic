
import { Component, OnInit } from '@angular/core';
import { ChartType, ChartOptions } from 'chart.js';
import {
  SingleDataSet,
  Label,
  monkeyPatchChartJsLegend,
  monkeyPatchChartJsTooltip
} from 'ng2-charts';
import { PingService } from 'src/app/services/ping-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SetupService } from 'src/app/services/setup-service';
import { LogService } from 'src/app/services/log-service';

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
  public status: any = null;
  public locLog: any = null;

  public pieChartOptions: ChartOptions = {
    responsive: true,
  };
  public pieChartLabels: Label[] = [['Backend LOC'], ['Frontend LOC']];
  public pieChartData: SingleDataSet = null;
  public pieChartType: ChartType = 'pie';
  public pieChartLegend = true;
  public pieChartPlugins = [];
  public pieChartColors = [{
    backgroundColor: [
      'rgba(180,180,180,0.8)',
      'rgba(120,120,120,0.8)',
    ]}];

  constructor(
    private pingService: PingService,
    private snackBar: MatSnackBar,
    private setupService: SetupService,
    private logService: LogService) {
    monkeyPatchChartJsTooltip();
    monkeyPatchChartJsLegend();
  }

  ngOnInit() {
    this.pingService.version().subscribe(res => {
      this.version = res.version;
      this.pingService.license().subscribe(res => {
        this.licenseInfo = res;
      });
      this.setupService.getStatus().subscribe(res => {
        this.status = res;
      });
      this.logService.getLocLog().subscribe(res => {
        if (res.backend !== 0 || res.frontend !== 0) {
          this.pieChartData = [res.backend, res.frontend];
          this.locLog = res;
        }
      });
    }, error => {
      this.snackBar.open(error.error.message || 'Something went wrong when trying to ping backend', 'Close');
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

  getAllowanceOfLicense(licenseType: string) {
    switch (licenseType) {
      case 'enterprise':
        return 'You can use this license on any amount of servers in your corporation';
      case 'single-server':
        return 'You can use this license on a single production server, and as many developer machines as you wish';
      default:
        return 'Unknown license type';
    }
  }

  private getManDays() {
    const locTotal = this.locLog.backend + this.locLog.frontend;
    const locPerMonth = 537; // Human productivity per month according to studies in the subject
    const locPerDay = locPerMonth / 22; // Working days per month
    const totalDaysOfWork = locTotal / locPerDay;
    return totalDaysOfWork;
  }

  getManDaysLocalString() {
    return this.getManDays().toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  }

  costOfDeveloperPerDay() {
    return 3300 / 22; // Cost per month in EURO divided by working days in a month
  }

  createdValue() {
    const costOfDeveloper = this.costOfDeveloperPerDay();
    const locOfHumanPerDay = this.getManDays();
    return locOfHumanPerDay * costOfDeveloper;
  }

  getROI() {
    const totalManDays = this.getManDays();
    const priceOfLicense = 346; // The average cost of a single server license
    const priceOfDeveloperPerDay = this.costOfDeveloperPerDay();
    const daysOfDevelopment = priceOfLicense / priceOfDeveloperPerDay;
    return ((totalManDays / daysOfDevelopment) * 100).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  }
}
