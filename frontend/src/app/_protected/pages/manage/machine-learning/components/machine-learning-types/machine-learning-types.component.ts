
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { OpenAIConfigurationDialogComponent } from 'src/app/_general/components/openai/openai-configuration-dialog/openai-configuration-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MachineLearningTrainingService } from 'src/app/_general/services/machine-learning-training.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';
import { MachineLearningEditTypeComponent } from '../machine-learning-edit-type/machine-learning-edit-type.component';
import { MachineLearningImportComponent } from '../machine-learning-import/machine-learning-import.component';
import { MachineLearningTestComponent } from '../machine-learning-test/machine-learning-test.component';
import { MachineLearningTrainComponent } from '../machine-learning-train/machine-learning-train.component';

/**
 * Helper component to manage machine learning types, different models, and configurations
 * for your types.
 */
@Component({
  selector: 'app-machine-learning-types',
  templateUrl: './machine-learning-types.component.html',
  styleUrls: ['./machine-learning-types.component.scss']
})
export class MachineLearningTypesComponent implements OnInit {

  @Input() isConfigured: boolean = false;
  @Output() isConfiguredChange = new EventEmitter<boolean>();

  filter: any = {
    limit: -1,
  };
  isLoadingKey: boolean = false;
  displayedColumns: string[] = [
    'type',
    'model',
    'auth',
    'action',
  ];
  types: any[] = null;

  constructor(
    private dialog: MatDialog,
    private openAIService: OpenAIService,
    private generalService: GeneralService,
    private machineLearningTrainingService: MachineLearningTrainingService) { }

  ngOnInit() {

    this.isLoadingKey = true;
    this.getConfiguredStatus();
  }

  sortData(e: any) {

    if (e.direction === '') {

      delete this.filter['order'];
      delete this.filter['direction'];
      this.getModels();
      return;
    }

    this.filter['order'] = e.active;
    this.filter['direction'] = e.direction;
    this.getModels();
  }

  configure() {

    this.dialog
      .open(OpenAIConfigurationDialogComponent, {
        width: '80vw',
        maxWidth: '550px',
      })
      .afterClosed()
      .subscribe((result: {configured: boolean}) => {

        if (result?.configured) {
          this.isConfigured = true;
          this.isConfiguredChange.emit(this.isConfigured);
          this.getModels();
        }
      });
  }

  addType() {

    this.dialog
      .open(MachineLearningEditTypeComponent, {
        width: '80vw',
        maxWidth: '550px',
      })
      .afterClosed()
      .subscribe((result: any) => {

        if (result) {

          this.generalService.showLoading();
          this.machineLearningTrainingService.ml_types_create(result).subscribe({
            next: () => {

              this.getModels();
              this.generalService.showFeedback('Model successfully saved', 'successMessage');
            },
            error: () => {

              this.generalService.hideLoading();
              this.generalService.showFeedback('Something went wrong as we tried to create your type', 'errorMessage');
            }
          });
        }
    });
  }

  import(el: any) {

    this.dialog
      .open(MachineLearningImportComponent, {
        width: '80vw',
        maxWidth: '850px',
        data: el,
      });
  }

  train(el: any) {

    this.dialog
      .open(MachineLearningTrainComponent, {
        width: '80vw',
        maxWidth: '550px',
        data: el,
      })
      .afterClosed()
      .subscribe((result: any) => {

        if (result) {

          this.generalService.showLoading();
          this.openAIService.start_training(result).subscribe({
            next: () => {

              this.generalService.hideLoading();
              this.generalService.showFeedback('Training successfully started', 'successMessage');
            },
            error: () => {

              this.generalService.hideLoading();
              this.generalService.showFeedback('Something went wrong as we tried to start training', 'errorMessage');
            }
          });
        }
    });
  }

  test(el: any) {

    this.dialog
      .open(MachineLearningTestComponent, {
        width: '80vw',
        maxWidth: '850px',
        data: el,
      });
  }

  edit(el: any) {

    this.dialog
      .open(MachineLearningEditTypeComponent, {
        width: '80vw',
        maxWidth: '550px',
        data: el,
      })
      .afterClosed()
      .subscribe((result: any) => {

        if (result) {

          this.generalService.showLoading();
          this.machineLearningTrainingService.ml_types_update(result).subscribe({
            next: () => {

              this.getModels();
              this.generalService.showFeedback('Model successfully saved', 'successMessage');
            },
            error: () => {

              this.generalService.hideLoading();
              this.generalService.showFeedback('Something went wrong as we tried to create your type', 'errorMessage');
            }
          });
        }
    });
  }

  delete(el: any) {

    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: 'Delete model',
        description_extra: `You are deleting the following model: <br/> <span class="fw-bold">${el.type}</span> <br/><br/>This will delete all data associated with your model, including training data. Do you want to continue?`,
        action_btn: 'Delete',
        close_btn: 'Cancel',
        action_btn_color: 'warn',
        bold_description: true,
        extra: {
          details: el.type,
          action: 'confirmInput',
          fieldToBeTypedTitle: `model type name`,
          fieldToBeTypedValue: el.type,
          icon: 'database',
        }
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {

        this.generalService.showLoading();
        this.machineLearningTrainingService.ml_types_delete(el.type).subscribe({
          next: () => {
    
            this.generalService.showFeedback('Model successfully deleted', 'successMessage');
            this.getModels();
          },
          error: (error: any) => {
    
            this.generalService.showFeedback(error, 'errorMessage', 'Ok');
            this.generalService.hideLoading();
          }
        });
      }
    });
  }

  /*
   * Private helper methods.
   */

  private getModels() {

    this.generalService.showLoading();
    this.machineLearningTrainingService.ml_types(this.filter).subscribe({
      next: (types: any[]) => {

        this.types = types || [];
        this.generalService.hideLoading();
      },
      error: (error: any) => {

        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        this.generalService.hideLoading();
      }
    });
  }

  private getConfiguredStatus() {

    this.openAIService.isConfigured().subscribe({
      next: (result: { result: boolean }) => {

        if (!result.result) {
          this.isLoadingKey = false;
          this.generalService.hideLoading();
          return;
        }
        this.isConfigured = true;
        this.isConfiguredChange.emit(this.isConfigured);
        this.getModels();
      },
      error: (error: any) => {

        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        this.generalService.hideLoading();
      }
    });
  }
}
