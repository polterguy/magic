
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
import { OpenAIConfigurationDialogComponent } from '../common/openai/openai-configuration-dialog/openai-configuration-dialog.component';
import { Count } from 'src/app/models/count.model';
import { MachineLearningTrainingService } from 'src/app/services/machine-learning-training.service';
import { MachineLearningImportFeedbackComponent } from '../manage/machine-learning/components/machine-learning-import-feedback/machine-learning-import-feedback.component';
import { ConfirmationDialogComponent } from '../common/confirmation-dialog/confirmation-dialog.component';

/**
 * Primary dashboard component, showing vibe coding component allowing user to automate system using natural language.
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {

  private _isRetrievingSystemReport = false;
  systemReport: any = null;
  userIsRoot: boolean = undefined;
  isLoading: boolean = true;
  userAsUsername: string = '';

  constructor(
    private generalService: GeneralService,
    private dialog: MatDialog,
    private router: Router,
    private backendService: BackendService,
    private diagnosticsService: DiagnosticsService,
    private machineLearningTrainingService: MachineLearningTrainingService) { }

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
      next: (report: SystemReport[]) => {

        // Allowing us to retrieve system report again.
        this._isRetrievingSystemReport = false;

        // Binding model
        this.systemReport = report;

        // Checking if system has been configured with an OpenAI API key, and if not, displaying the modal window that asks the user.
        if (this.systemReport.has_openai === false) {

          this.dialog
            .open(OpenAIConfigurationDialogComponent, {
              width: '80vw',
              maxWidth: '550px',
              disableClose: true,
            })
            .afterClosed()
            .subscribe((result: any) => {

              if (result.configured) {

                this.systemReport.has_openai = true;
                this.checkIfDefaultIsVectorized();
              }
            });

        } else {

          this.checkIfDefaultIsVectorized();
        }
      },
      error: (error: any) => {

        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this._isRetrievingSystemReport = false;
      }
    });
  }

  private checkIfDefaultIsVectorized() {

    this.machineLearningTrainingService.ml_training_snippets_count({
      ['ml_training_snippets.type.eq']: 'default',
      ['not_embedded']: true,
    }).subscribe({

      next: (result: Count) => {

        if (result.count !== 0) {

          this.dialog.open(ConfirmationDialogComponent, {
            width: '500px',
            data: {
              title: 'Confirm operation',
              description_extra: `Do you want to vectorise the model called; <span class="fw-bold">default</span><br/>It has ${result.count} snippets`,
              action_btn: 'Vectorise',
              close_btn: 'Cancel',
              bold_description: true
            }
          }).afterClosed().subscribe((result: string) => {

            if (result === 'confirm') {

              this.machineLearningTrainingService.ml_training_snippets_count({
                ['ml_training_snippets.type.eq']: 'default',
                ['not_embedded']: true,
              }).subscribe({

                next: (result: Count) => {

                  if (result.count !== 0) {

                    this.dialog
                    .open(MachineLearningImportFeedbackComponent, {
                      width: '80vw',
                      maxWidth: '1280px',
                      data: {
                        url: result,
                        type: 'default',
                        mode: 'vectorize'
                      }
                    }).afterClosed().subscribe(() => {
                      this.isLoading = false;
                    });
                  }
                }
              });

            } else {

              this.generalService.showFeedback('You can always later vectorize the type through machine learning', 'successMessage');
              this.isLoading = false;
            }
          });
        } else {

          this.isLoading = false;
        }
      },

      error: () => {

        this.generalService.hideLoading();
        this.generalService.showFeedback('Something went wrong as we tried to create embeddings for model', 'errorMessage');
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
