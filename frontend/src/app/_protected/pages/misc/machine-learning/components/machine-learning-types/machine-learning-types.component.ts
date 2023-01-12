
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MachineLearningTrainingService } from 'src/app/_general/services/machine-learning-training.service';
import { MachineLearningTypeComponent } from '../machine-learning-type/machine-learning-type.component';

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

  displayedColumns: string[] = [
    'model',
    'type',
    'temperature',
    'action'
  ];
  types: any[] = null;

  constructor(
    private dialog: MatDialog,
    private generalService: GeneralService,
    private machineLearningTrainingService: MachineLearningTrainingService) { }

  ngOnInit() {

    this.getTypes();
  }

  addType() {

    this.dialog
      .open(MachineLearningTypeComponent, {
        width: '80vw',
        maxWidth: '550px',
      })
      .afterClosed()
      .subscribe((result: any) => {

        if (result) {

          this.generalService.showLoading();
          this.machineLearningTrainingService.ml_types_create(result).subscribe({
            next: () => {

              this.getTypes();
              this.generalService.showFeedback('Type successfully saved', 'successMessage');
            },
            error: () => {

              this.generalService.hideLoading();
              this.generalService.showFeedback('Something went wrong as we tried to create your type', 'errorMessage');
            }
          });
        }
    });
  }

  edit(el: any) {
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
            this.getTypes();
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

  private getTypes() {

    this.generalService.showLoading();
    this.machineLearningTrainingService.ml_types().subscribe({
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
}
