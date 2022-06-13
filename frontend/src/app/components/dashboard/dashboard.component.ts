
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular specific imports.
import moment from 'moment';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';

// Application specific imports.
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { DiagnosticsService } from 'src/app/services/diagnostics.service';
import { LogTypes, SystemReport, Timeshifts } from '../../models/dashboard.model';
import { LoginDialogComponent } from '../utilities/login-dialog/login-dialog.component';
import { IntroGuideComponent } from '../utilities/intro-guide/intro-guide.component';

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
  private activeBackendSubscriber: Subscription;
  private _isRetrievingSystemReport = false;

  /**
   * Chart type.
   */
  chartType: boolean[] = [];

  systemReport: any = null;
  systemReportDisplayable: any;
  timeshiftChart: Timeshifts[] = [];
  logTypesChart: LogTypes[];

  // default is set for all charts to be displayed
  chartsList: any = [];

  /**
   * for preparing chart data + name and description dynamically
   */
  chartData: any = [];

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
    private feedbackService: FeedbackService,
    private cdr: ChangeDetectorRef) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {

    // Making sure we retrieve system reports when user is authenticated.
    this.authSubscriber = this.backendService.authenticatedChanged.subscribe((authenticated: boolean) => {
      if (authenticated && this.backendService.active?.token?.in_role('root')) {
        this.getSystemReport();
        this.showIntroDialog();
      }
    });
    this.activeBackendSubscriber = this.backendService.activeBackendChanged.subscribe(() => {
      if (this.backendService.active?.token?.in_role('root')) {
        this.getSystemReport();
      }
    });

  }

  /**
   * Implementation of OnDestroy.
   */
  ngOnDestroy() {

    // Ensuring we unsubscribe from authenticated subscription and active backend changed subscription.
    this.authSubscriber.unsubscribe();
    this.activeBackendSubscriber.unsubscribe();
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
    this.cdr.markForCheck();
    // Avoiding race conditions.
    if (this._isRetrievingSystemReport) {
      return;
    }
    this._isRetrievingSystemReport = true;

    // Retrieving system report from backend.
    this.diagnosticsService.getSystemReport().subscribe({
      next: (report: SystemReport[]) => {
        // emptying arrays to prevent displaying wrong information while switching between backends,
        // if not, when system information is not available, the arrays are still filled with the previous system's information data.
        this.chartsList = [];
        this.chartData = {};
        this.systemReportDisplayable = null;

        // Allowing us to retrieve system report again.
        this._isRetrievingSystemReport = false;

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
          Object.keys(report['timeshifts']).forEach((el: any) => {

            // Preparing chart list for setting user preferences
            this.chartsList.push({name: report['timeshifts'][el].name, value: el, status: true});
            this.chartData[el] = { label: report['timeshifts'][el].items.map(x => {return moment(x.when).format("D. MMM")}), data: report['timeshifts'][el].items.map(x => {return x.count}), name: report['timeshifts'][el].name, description: report['timeshifts'][el].description};

          })
        }
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.feedbackService.showError(error);
        this._isRetrievingSystemReport = false;
      }});
  }

  private showIntroDialog() {
    if (localStorage.getItem('intro')) {
      return;
    }
    this.dialog.open(IntroGuideComponent, {
      width: '80%',
      height: '80%',
      panelClass: ['intro-panel']
    }).afterClosed().subscribe(() => {
      localStorage.setItem('intro','passes')
    })
  }

  /**
   * Just an empty function, needed to keep the chartData itteration unsorted by the keyvalue pipe.
   */
  unsorted() {}
}
