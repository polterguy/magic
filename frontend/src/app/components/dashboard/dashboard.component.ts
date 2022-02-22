
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { Component, OnInit } from '@angular/core';
import { AuthService } from '../management/auth/services/auth.service';
import { DashboardService } from './services/dashboard.service';
import { ConfigService } from '../management/config/services/config.service';
import { FeedbackService } from 'src/app/services/feedback.service';

import { LogTypes, SystemReport, Timeshifts } from './models/dashboard.model';
import { LoginDialogComponent } from '../app/login-dialog/login-dialog.component';

import moment from 'moment';
import { ChartOptions } from 'chart.js';

// Importing global chart colors.
import colors from './bar_chart_colors.json';
import { MatDialog } from '@angular/material/dialog';

/**
 * Dashboard component displaying general information about Magic,
 * and possibly some statistics.
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  chartType: boolean[] = [];
  public systemReport: any;
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

  // dashboard charts
  chartPreference: string[] = [];
  // default is set for all charts to be displayed
  chartsList: any = [];

  /**
   * for preparing chart data + name and description dynamically
   */
  chartData: any = [];
  
  /**
   * to keep at least one chart not removable
   */
  notChangableChart: string;

  /**
   * 
   * @param authService defining the user's login status
   * @param dashboardService retrieving the activities on the system 
   * @param dialog Dialog reference necessary to show login dialog if user tries to login
   */
  constructor(
    public authService: AuthService,
    private dashboardService: DashboardService,
    private dialog: MatDialog,
    private configService: ConfigService,
    private feedbackService: FeedbackService
  ) { }

  ngOnInit(): void {
    // to check if user has access to the application or not
    this.getAuthenticationStatus(); 
  }

  /**
   * getting user's preferences for the displayed charts inside dashboard
   * and storing them inside localstorage
   */
  getChartPreferences(){
    if (localStorage.getItem('chartPreference')) {
      this.chartPreference = JSON.parse(localStorage.getItem('chartPreference'));
    } else {
      this.chartsList.forEach((element, index) => {
        this.chartPreference.push(element.value);
        localStorage.setItem('chartPreference', JSON.stringify(this.chartPreference))
      });
    }
  }

  /**
   * set dashboard charts preferences and store in localStorage
   * show success message, so the user understands what he's done!
   */
  setPreference(){
    localStorage.setItem('chartPreference', JSON.stringify(this.chartPreference));
    this.feedbackService.showInfo('Preferences updated successfuly.');
  }

  /**
   * to get the user's authentication state
   * if user is logged in then retrieve the system's reports
   */
  private getAuthenticationStatus() {
    let isConfigured: boolean;
    (async () => {
      while (!this.authService.authenticated)
        await new Promise(resolve => setTimeout(resolve, 100));

        /**
         * if user is logged in, then check if db is configured
         */
        this.configService.configStatus.subscribe(status => {
          isConfigured = status;
          if (this.authService.authenticated && isConfigured) {
            // if db is configured and also user is logged in, then call system report
            this.getSystemReport();
          }
        });
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
      if (report["timeshifts"]) {
        Object.keys(report['timeshifts']).forEach((el: any) => {
          // preparing chart list for setting user preferences
          this.chartsList.push({name: report['timeshifts'][el].name, value: el, status: true});
          this.chartPreference.forEach(item => {
            if (item === el) {
              this.chartData[item].push({when: report['timeshifts'][el].items.when, count: report['timeshifts'][el].items.count})
            }
          });
          this.chartData[el] = { label: report['timeshifts'][el].items.map(x => {return moment(x.when).format("D. MMM")}), data: report['timeshifts'][el].items.map(x => {return x.count}), name: report['timeshifts'][el].name, description: report['timeshifts'][el].description};

          // to prevent removing ALL charts, we keep the first index disabled... so it can't be removed
          this.notChangableChart = this.chartsList[0].value;
        })
      }
      // get the user's preferences for charts
      this.getChartPreferences();
      
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
