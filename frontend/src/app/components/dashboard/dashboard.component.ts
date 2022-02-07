import { Component, OnInit } from '@angular/core';
import { AuthService } from '../management/auth/services/auth.service';
import { DashboardService } from './services/dashboard.service';

import { LogTypes, SystemReport, Timeshifts } from './models/dashboard.model';
import { LoginDialogComponent } from '../app/login-dialog/login-dialog.component';

import moment from 'moment';
import { ChartOptions } from 'chart.js';

// Importing global chart colors.
import colors from './bar_chart_colors.json';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  chartType: boolean[] = [];

  public systemReport: any;
  // public systemReport: SystemReport[];
  public systemReportDisplayable: any;

  public logTypesChart: LogTypes[];

  public timeshiftChart: Timeshifts[] = [];
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

  /** TODO::::::: needs modification */
   access_deniedLabel: string[] = [];
   access_deniedData: string[] = [];

   backend_endpoints_generatedLabel: string[] = [];
   backend_endpoints_generatedData: string[] = [];
   
   loginsLabel: string[] = [];
   loginsData: string[] = [];

   unhandled_exceptionsLabel: string[] = [];
   unhandled_exceptionsData: string[] = [];
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
      if (report["timeshifts"]) {
        Object.keys(report['timeshifts']).forEach((item: any,index) => {
          this.timeshiftChart.push(report['timeshifts'][item]);
        })
        // this.timeshiftChart.forEach((item: any, index) => {
        //   item.forEach(element => {
        //     this.access_deniedLabel.push(moment(element.when).format("D. MMM"));
        //     this.access_deniedLabel.push(element.count);
        //   });
        // })
        this.access_deniedLabel = report['timeshifts'].access_denied.items.map(x => {return moment(x.when).format("D. MMM")});
        this.access_deniedData = report['timeshifts'].access_denied.items.map(x => {return x.count});

        this.backend_endpoints_generatedLabel = report['timeshifts'].backend_endpoints_generated.items.map(x => {return moment(x.when).format("D. MMM")});
        this.backend_endpoints_generatedData = report['timeshifts'].backend_endpoints_generated.items.map(x => {return x.count});

        this.loginsLabel = report['timeshifts'].logins.items.map(x => {return moment(x.when).format("D. MMM")});
        this.loginsData = report['timeshifts'].logins.items.map(x => {return x.count});

        this.unhandled_exceptionsLabel = report['timeshifts'].unhandled_exceptions.items.map(x => {return moment(x.when).format("D. MMM")});
        this.unhandled_exceptionsData = report['timeshifts'].unhandled_exceptions.items.map(x => {return x.count});
      }
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
