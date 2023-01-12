
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { OpenAIConfigurationDialogComponent } from 'src/app/_general/components/openai/openai-configuration-dialog/openai-configuration-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MachineLearningTrainingService } from 'src/app/_general/services/machine-learning-training.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';
import { MachineLearningDetailsComponent } from '../machine-learning-details/machine-learning-details.component';

/**
 * Helper component to administrate training data for OpenAI integration
 * and Machine Learning integration.
 */
@Component({
  selector: 'app-machine-learning-training',
  templateUrl: './machine-learning-training.component.html',
  styleUrls: ['./machine-learning-training.component.scss']
})
export class MachineLearningTrainingComponent implements OnInit {

  isLoadingKey: boolean = false;
  isConfigured: boolean = false;
  types: string[] = null;
  type: string = null;
  dataSource: any[] = null;
  count: number = 0;
  filter: any = {
    limit: 10,
    offset: 0,
  };
  displayedColumns: string[] = [
    'prompt',
    'type',
    'pushed',
    'action',
  ];

  constructor(
    private dialog: MatDialog,
    private generalService: GeneralService,
    private openAIService: OpenAIService,
    private machineLearningTrainingService: MachineLearningTrainingService) { }

  ngOnInit() {

    this.generalService.showLoading();
    this.isLoadingKey = true;
    this.getConfiguredStatus();
  }

  create() {

    if (this.types.length === 0) {
      this.generalService.showFeedback('You need to create at least one type first', 'errorMessage');
      return;
    }

    this.dialog
      .open(MachineLearningDetailsComponent, {
        width: '80vw',
        maxWidth: '850px',
        disableClose: true,
        data: {
          type: this.type,
        }
      })
      .afterClosed()
      .subscribe((result: any) => {

        if (result) {

          this.machineLearningTrainingService.ml_training_snippets_create(result).subscribe({
            next: () => {

              this.generalService.showFeedback('Snippet successfully created', 'successMessage');
              this.getTrainingData(true);
            },
            error: () => this.generalService.showFeedback('Something went wrong as we tried to create your snippet', 'errorMessage')
          });
        }
    });
  }

  configure() {

    this.dialog
      .open(OpenAIConfigurationDialogComponent, {
        width: '80vw',
        maxWidth: '550px',
      })
      .afterClosed()
      .subscribe((result: {configured: boolean}) => {

        if (result.configured) {
          this.isConfigured = true;
          this.getTypes(true);
        }
      });
  }

  showDetails(el: any) {

    this.dialog
      .open(MachineLearningDetailsComponent, {
        width: '80vw',
        maxWidth: '850px',
        disableClose: true,
        data: el,
      })
      .afterClosed()
      .subscribe((result: any) => {

        if (result) {
          if (result?.id) {

            this.machineLearningTrainingService.ml_training_snippets_update(result).subscribe({
              next: () => {

                this.generalService.showFeedback('Snippet updated successfully', 'successMessage');
                this.getTrainingData(false);
              },
              error: () => this.generalService.showFeedback('Something went wrong as we tried to update your snippet', 'errorMessage')
            });
          } else {

            this.machineLearningTrainingService.ml_training_snippets_create(result);
          }
        }
    });
  }

  delete(el: any) {

    this.machineLearningTrainingService.ml_training_snippets_delete(el.id).subscribe({
      next: () => {

        this.generalService.showFeedback('Snippet successfully deleted', 'successMessage');
        this.getTrainingData(true);
      },
      error: () => this.generalService.showFeedback('Something went wrong as we tried to delete your snippet', 'errorMessage')
    });
  }

  page(event: PageEvent) {

    this.filter.offset = event.pageIndex * event.pageSize;
    this.getTrainingData(false);
  }

  filterList(event: { searchKey: string, type?: string }) {

    this.filter = {
      limit: this.filter.limit,
      offset: 0,
    };
    if (event.searchKey) {
      this.filter['ml_training_snippets.prompt.like'] = '%' + event.searchKey + '%';
    }
    if (event.type) {
      this.filter['ml_training_snippets.type.eq'] = event.type;
    }
    this.getTrainingData(true);
  }

  /*
   * Private helper methods.
   */

  private getConfiguredStatus() {

    this.openAIService.isConfigured().subscribe({
      next: (result: { result: boolean }) => {

        if (!result.result) {
          this.isLoadingKey = false;
          this.generalService.hideLoading();
          return;
        }
        this.isConfigured = true;
        this.getTypes();
      },
      error: (error: any) => {

        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        this.generalService.hideLoading();
      }
    });
  }

  private getTypes(getTrainingData: boolean = true) {

    this.machineLearningTrainingService.ml_types().subscribe({
      next: (types: any[]) => {

        types = types || [];

        this.types = types.map(x => x.type);

        if (getTrainingData) {
          this.getTrainingData();
          return;
        }

        this.generalService.hideLoading();
      },
      error: (error: any) => {

        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        this.generalService.hideLoading();
      }
    });
  }

  private getTrainingData(count: boolean = true) {

    this.machineLearningTrainingService.ml_training_snippets(this.filter).subscribe({
      next: (result: any[]) => {

        this.dataSource = result || [];

        if (!count) {
          this.generalService.hideLoading();
          return;
        }

        const countFilter: any = {};
        for (const idx in this.filter) {
          if (idx !== 'limit' && idx !== 'offset') {
            countFilter[idx] = this.filter[idx];
          }
        }
    
        this.machineLearningTrainingService.ml_training_snippets_count(countFilter).subscribe({
          next: (result: any) => {

            this.count = result.count;
            this.generalService.hideLoading();
          },
          error: (error: any) => {

            this.generalService.showFeedback(error, 'errorMessage', 'Ok');
            this.generalService.hideLoading();
          }
        });
      },
      error: (error: any) => {

        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        this.generalService.hideLoading();
      }
    });
  }
}
