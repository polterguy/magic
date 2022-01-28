import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';
import { DashboardService } from './services/dashboard.service';

import { LogTypes, SystemReport, Timeshifts } from './models/dashboard.model';
import { LoginDialogComponent } from 'src/app/components/app/login-dialog/login-dialog.component';

import moment from 'moment';
import { ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

// Importing global chart colors.
import colors from './bar_chart_colors.json';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  chartType: string = 'line';

  public systemReport: SystemReport[];
  public systemReportDisplayable: any;

  public logTypesChart: LogTypes[];

  public timeshiftChart: Timeshifts[];
  public timeshiftChartLabel: string[] = [];
  public timeshiftChartData: string[] = [];

  /**
   * Common bar chart colors.
   */
   public colors = colors;
   public borderColor: string = "red";

   public theme = localStorage.getItem("theme");


  public barChartOptions: ChartOptions = {
    responsive: true,
    legend: {
      display: false,
    },
    scales: {
      xAxes: [{
        gridLines: {
          borderDash: [8, 4],
          color: 'rgba(0,0,0,0.05)',
        }
      }],
      yAxes: [{
        gridLines: {
          borderDash: [8, 4],
          color: 'rgba(0,0,0,0.05)',
        }
      }]
  },
    maintainAspectRatio: false
  };

  /**
   * 
   * @param authService defining the user's login status
   * @param dashboardService retrieving the activities on the system 
   * @param dialog Dialog reference necessary to show login dialog if user tries to login
   */
  constructor(
    public authService: AuthService,
    private dashboardService: DashboardService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.getAuthenticationStatus();
  }

  /**
   * to get the user's authentication state
   * if user is logged in then retrieve the system's reports
   */
  private getAuthenticationStatus() {
    (async () => {
      while (!this.authService.authenticated)
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.authService.authenticated) {
        this.getSystemReport();
      }
    })();
  }

  /**
   * Retrieving the system's report
   */
  private getSystemReport() {
    this.dashboardService.getSystemReport().subscribe((report: SystemReport[]) => {
      this.systemReport = report;
      /**
       * to display system reports in the html file
       */
      this.systemReportDisplayable = this.systemReport;
      this.logTypesChart = report['log_types'];

      /**
       * preparing data with variable key
       */
      Object.keys(report['timeshifts']).forEach((item: any) => {
        this.timeshiftChart = report['timeshifts'][item];
      })
      this.timeshiftChart.forEach((item: any) => {
        this.timeshiftChartLabel.push(moment(item.when).format("D. MMM"));
        this.timeshiftChartData.push(item.count);
      })
    })
  }

  /**
   * Allows user to login by showing a modal dialog.
   */
   public login() {
    this.dialog.open(LoginDialogComponent, {
      width: '550px',
    });
  }
}
