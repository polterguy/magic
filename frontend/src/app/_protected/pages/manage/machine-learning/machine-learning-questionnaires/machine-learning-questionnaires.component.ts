
/*
 * Copyright (c) Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MachineLearningTrainingService } from 'src/app/_general/services/machine-learning-training.service';
import { MachineLearningEditQuestionnaireComponent } from '../components/machine-learning-edit-questionnaire/machine-learning-edit-questionnaire.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { MachineLearningEditQuestionsComponent } from '../components/machine-learning-edit-questions/machine-learning-edit-questions.component';

/**
 * Questionnaires component for declaring questionnaires and questions associated
 * with your machine learning models.
 */
@Component({
  selector: 'app-machine-learning-questionnaires',
  templateUrl: './machine-learning-questionnaires.component.html',
  styleUrls: ['./machine-learning-questionnaires.component.scss']
})
export class MachineLearningQuestionnairesComponent implements OnInit {

  dataSource: any[] = null;
  count: number = 0;
  filter: any = {
    limit: 10,
    offset: 0,
  };
  displayedColumns: string[] = [
    'name',
    'actions',
  ];

  constructor(
    private machineLearningTrainingService: MachineLearningTrainingService,
    private generalService: GeneralService,
    private dialog: MatDialog) { }

  ngOnInit() {

    this.getData();
  }

  page(event: PageEvent) {

    this.filter.offset = event.pageIndex * event.pageSize;
    this.getData();
  }

  filterList(event: { searchKey: string }) {

    this.filter = {
      limit: this.filter.limit,
      offset: 0,
    };
    if (event.searchKey) {
      this.filter['questionnaires.name.like'] = '%' + event.searchKey + '%';
    }
    this.getData();
  }

  editQuestionnaire(el: any = null) {

    this.dialog
      .open(MachineLearningEditQuestionnaireComponent, {
        width: '450px',
        data: el,
      })
      .afterClosed()
      .subscribe((result: any) => {

        if (result) {

          this.generalService.showLoading();
          if (el) {
            this.machineLearningTrainingService.questionnaires_update(result).subscribe({

              next: () => {

                this.getData();
                this.generalService.showFeedback('Questionnaire successfully updated', 'successMessage');
              },

              error: (error: any) => {

                this.generalService.hideLoading();
                this.generalService.showFeedback(error?.error?.message ?? 'Something went wrong', 'errorMessage', 'Ok', 10000);
              }
            });
          } else {

            this.machineLearningTrainingService.questionnaires_create(result).subscribe({

              next: () => {

                this.getData();
                this.generalService.showFeedback('Questionnaire successfully saved', 'successMessage');
              },

              error: (error: any) => {

                this.generalService.hideLoading();
                this.generalService.showFeedback(error?.error?.message ?? 'Something went wrong', 'errorMessage', 'Ok', 10000);
              }
            });
          }
        }
    });
  }

  edit(el: any) {

    this.editQuestionnaire(el);
  }

  questions(el: any) {

    this.dialog.open(MachineLearningEditQuestionsComponent, {
      width: '80vw',
      data: el,
    });
  }

  delete(el: any) {

    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: 'Delete Questionnaire',
        description_extra: `You are deleting the following questionnaire: <br/> <span class="fw-bold">${el.name}</span> <br/><br/>This will delete all data associated with your questionnaire, including all of its questions. Do you want to continue?`,
        action_btn: 'Delete',
        close_btn: 'Cancel',
        action_btn_color: 'warn',
        bold_description: true,
        extra: {
          details: el.name,
          action: 'confirmInput',
          fieldToBeTypedTitle: `name`,
          fieldToBeTypedValue: el.name,
          icon: 'edit',
        }
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {

        this.generalService.showLoading();
        this.machineLearningTrainingService.questionnaires_delete(el.name).subscribe({
          
          next: () => {
    
            this.generalService.showFeedback('Questionnaire successfully deleted', 'successMessage');
            this.getData();
          },

          error: (error: any) => {
    
            this.generalService.showFeedback(error, 'errorMessage', 'Ok');
            this.generalService.hideLoading();
          }
        });
      }
    });
  }

  private getData() {

    // Showing Ajax loader.
    this.generalService.showLoading();

    // Retrieving questionnaires.
    this.machineLearningTrainingService.questionnaires(this.filter).subscribe({

      next: (result: any[]) => {

        this.dataSource = result || [];

        // Getting count of items.
        this.machineLearningTrainingService.questionnaires_count({
          ['questionnaires.name.like']: this.filter.name,
        }).subscribe({

          next: (result: any) => {

            this.generalService.hideLoading();
            this.count = result.count;
          },

          error: (error: any) => {

            this.generalService.hideLoading();
            this.generalService.showFeedback(error?.error?.message ?? 'Something went wrong as we tried to count questionnaires', 'errorMessage', 'Ok', 5000);
          }
        });
      },

      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? 'Something went wrong as we tried to retrieve questionnaires', 'errorMessage', 'Ok', 5000);
      }
    });
  }
}
