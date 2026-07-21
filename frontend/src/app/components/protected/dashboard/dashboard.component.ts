
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, OnInit } from '@angular/core';
import { GeneralService } from 'src/app/services/general.service';
import { BackendService } from 'src/app/services/backend.service';
import { DiagnosticsService } from 'src/app/services/diagnostics.service';
import { SystemReport } from './_models/dashboard.model';
import { ConfigureThemeDialog } from 'src/app/components/protected/dashboard/components/configure-theme/configure-theme-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

/**
 * Primary dashboard component, showing vibe coding component allowing user to automate system using natural language.
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {

  private _isRetrievingSystemReport = false;
  systemReport: SystemReport = null;
  userIsRoot: boolean = undefined;
  isLoading: boolean = true;
  userAsUsername: string = '';

  constructor(
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

    this.showInitDialog();
  }

  /*
   * Private helper methods.
   */

  private waitForData() {

    if (this.backendService.active?.token?.in_role('root')) {

      this.getSystemReport();
      this.userIsRoot = true;

    } else {

      this.userAsUsername = this.backendService.active.username;
      this.userIsRoot = false;
      this.isLoading = false;
    }
  }

  private getSystemReport() {

    if (this._isRetrievingSystemReport) {
      return;
    }
    this._isRetrievingSystemReport = true;

    this.diagnosticsService.getSystemReport().subscribe({
      next: (report: SystemReport) => {

        // Allowing us to retrieve system report again.
        this._isRetrievingSystemReport = false;

        // Binding model
        this.systemReport = report;
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

      this.waitForData();
      return;
    }

    const dialog = this.dialog.open(ConfigureThemeDialog, {
      width: '550px',
    });
    dialog.afterClosed().subscribe(() => {

      localStorage.setItem('configured', 'true');
      this.waitForData();
    });
  }
}
