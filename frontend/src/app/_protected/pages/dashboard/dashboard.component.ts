
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from '../../../_general/services/backend.service';
import { DiagnosticsService } from '../../../_general/services/diagnostics.service';
import moment from 'moment';
import { LogTypes, SystemReport } from './_models/dashboard.model';
import { ConfigureThemeDialog } from 'src/app/_protected/pages/dashboard/components/configure-theme/configure-theme-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

/**
 * Primary dashboard component, displaying dashboard information, such as
 * charts, statistics, general information, etc.
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {

  private _isRetrievingSystemReport = false;
  systemReport: any = null;
  systemReportDisplayable: any;
  logTypesChart: LogTypes[];
  chartsList: any = [];
  chartData: any = [];
  userIsRoot: boolean = undefined;
  isLoading: boolean = true;
  showInfoPanel: string = sessionStorage.getItem('infoPanel') || 'show';
  userAsUsername: string = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private generalService: GeneralService,
    private dialog: MatDialog,
    private router: Router,
    private backendService: BackendService,
    private diagnosticsService: DiagnosticsService) { }

  ngOnInit() {

    if (!this.backendService.active.setupDone) {
      this.router.navigate(['/setup']);
      return;
    }
    this.waitForData();
    this.showInitDialog();
  }

  hidePanel() {

    this.showInfoPanel = 'hide';
    this.cdr.detectChanges();
    sessionStorage.setItem('infoPanel', this.showInfoPanel);
  }

  unsorted() { }

  /*
   * Private helper methods.
   */

  private waitForData() {

    if (this.backendService.active?.token?.in_role('root')) {
      this.getSystemReport();
      this.userIsRoot = (this.backendService.active?.token?.in_role('root'));
    } else {
      this.userAsUsername = this.backendService.active.username;
      this.isLoading = false;
    }
    this.cdr.detectChanges();
  }

  private getSystemReport() {

    this.cdr.markForCheck();

    if (this._isRetrievingSystemReport) {
      return;
    }
    this._isRetrievingSystemReport = true;

    this.diagnosticsService.getSystemReport().subscribe({
      next: (report: SystemReport[]) => {

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
        this.systemReport = report || [];

        // To display system reports in the html file.
        this.systemReportDisplayable = this.systemReport;
        this.logTypesChart = report['log_types'] || [];

        // Preparing data with variable key
        if (report["timeshifts"]) {
          Object.keys(report['timeshifts']).forEach((el: any) => {

            // Preparing chart list for setting user preferences
            this.chartsList.push({ name: report['timeshifts'][el].name, value: el, status: true });
            this.chartData[el] = { label: report['timeshifts'][el].items.map(x => { return moment(x.when).format("D. MMM") }), data: report['timeshifts'][el].items.map(x => { return x.count }), name: report['timeshifts'][el].name, description: report['timeshifts'][el].description };

          })
        }
        this.cdr.detectChanges();
        this.isLoading = false;
      },
      error: (error: any) => {

        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this._isRetrievingSystemReport = false;
      }
    });
  }

  private showInitDialog() {

    const configured = localStorage.getItem('configured');
    if (configured) {
      return;
    }
    const dialog = this.dialog.open(ConfigureThemeDialog, {
      width: '550px',
    });
    dialog.afterClosed().subscribe(() => {
      localStorage.setItem('configured', 'true');
    });
  }
}
