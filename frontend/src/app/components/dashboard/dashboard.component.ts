
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular specific imports.
import moment from 'moment';
import { Subscription } from 'rxjs';
import { ChartOptions } from 'chart.js';
import { MatDialog } from '@angular/material/dialog';
import { Component, OnDestroy, OnInit } from '@angular/core';

// Application specific imports.
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { DiagnosticsService } from 'src/app/services/diagnostics.service';
import { LogTypes, SystemReport, Timeshifts } from '../../models/dashboard.model';
import { LoginDialogComponent } from '../utilities/login-dialog/login-dialog.component';

// Importing global chart colors.
import colors from './bar_chart_colors.json';

/**
 * Dashboard component displaying general information about Magic,
 * and possibly some statistics.
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  private authSubscriber: Subscription;
  private _isRetrievingSystemReport = false;

  public chartType: boolean[] = [];
  public systemReport: any = null;
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

  barChartOptions: ChartOptions = {
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

  // Dashboard charts
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
   * @param backendService Needed to retrieve user's loging status
   * @param diagnosticsService retrieving the activities on the system 
   * @param dialog Dialog reference necessary to show login dialog if user tries to login
   * @param feedbackService Needed to provide feedback to user
   */
  constructor(
    public backendService: BackendService,
    private diagnosticsService: DiagnosticsService,
    private dialog: MatDialog,
    private feedbackService: FeedbackService) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {

    // Making sure we retrieve system reports when user is authenticated.
    this.authSubscriber = this.backendService.authenticatedChanged.subscribe((authenticated: boolean) => {
      if (authenticated && this.backendService.active?.token?.in_role('root') && !this.systemReport) {
        this.getSystemReport();
      }
    });
    this.backendService.activeBackendChanged.subscribe(() => {
      if (this.backendService.active?.token?.in_role('root')) {
        this.getSystemReport();
      }
    });
  }

  /**
   * Implementation of OnDestroy.
   */
  ngOnDestroy() {

    // Ensuring we unsubscribe from authenticated subscription.
    this.authSubscriber.unsubscribe();
  }

  /**
   * set dashboard charts preferences and store in localStorage
   * show success message, so the user understands what he's done!
   */
  setPreference() {
    localStorage.setItem('chartPreference', JSON.stringify(this.chartPreference));
    this.feedbackService.showInfo('Preferences updated successfuly.');
  }

  /**
   * Allows user to login by showing a modal dialog.
   */
  login() {
    this.dialog.open(LoginDialogComponent, {
      width: '550px',
    });
  }

  /*
   * Private helper methods.
   */

  /*
   * Retrieving the system's report
   */
  private getSystemReport() {

    // Avoiding race conditions.
    if (this._isRetrievingSystemReport) {
      return;
    }
    this._isRetrievingSystemReport = true;

    // Retrieving system report from backend.
    this.diagnosticsService.getSystemReport().subscribe({
      next: (report: SystemReport[]) => {

        // Ensuring backend actually returned something.
        if (!report) {
          return;
        }

        // Binding model
        this.systemReport = report;

        // To display system reports in the html file.
        this.systemReportDisplayable = this.systemReport;
        this.logTypesChart = report['log_types'];

        // Preparing data with variable key
        if (report["timeshifts"]) {
          this.chartsList = [];
          this.chartData = {};
          Object.keys(report['timeshifts']).forEach((el: any) => {

            // Preparing chart list for setting user preferences
            this.chartsList.push({name: report['timeshifts'][el].name, value: el, status: true});
            this.chartData[el] = { label: report['timeshifts'][el].items.map(x => {return moment(x.when).format("D. MMM")}), data: report['timeshifts'][el].items.map(x => {return x.count}), name: report['timeshifts'][el].name, description: report['timeshifts'][el].description};

            // To prevent removing ALL charts, we keep the first index disabled... so it can't be removed
            this.notChangableChart = this.chartsList[0].value;
          })
        }

        // Get the user's preferences for charts
        this.getChartPreferences();

      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /*
   * Getting user's preferences for the displayed charts inside dashboard
   * and storing them inside localstorage
   */
  private getChartPreferences() {
    if (localStorage.getItem('chartPreference')) {
      this.chartPreference = JSON.parse(localStorage.getItem('chartPreference'));
    } else {
      this.chartsList.forEach((element, index) => {
        this.chartPreference.push(element.value);
        localStorage.setItem('chartPreference', JSON.stringify(this.chartPreference))
      });
    }
  }
}
