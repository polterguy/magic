
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MachineLearningTrainingService } from 'src/app/_general/services/machine-learning-training.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';

/**
 * Helper component to administrate training data for OpenAI integration
 * and Machine Learning integration.
 */
@Component({
  selector: 'app-machine-learning',
  templateUrl: './machine-learning.component.html',
  styleUrls: ['./machine-learning.component.scss']
})
export class MachineLearningTrainingComponent implements OnInit {

  isLoadingGrid: boolean = false;
  isLoadingConfig: boolean = false;
  dataSource: any[] = [];
  filter: any = {
    limit: 10,
    offset: 0,
  };
  count: number = 0;
  displayedColumns: string[] = [
    'type',
    'prompt',
    'pushed',
    'action',
  ];
  key: string = null;
  selectedModel: any = null;
  models: any[] = [];
  types: string[] = null;
  max_tokens: number = 2000;
  temperature: number = 0.1;

  constructor(
    private generalService: GeneralService,
    private openAIService: OpenAIService,
    private machineLearningTrainingService: MachineLearningTrainingService) { }

  ngOnInit() {

    this.isLoadingGrid = true;
    this.isLoadingConfig = true;
    this.generalService.showLoading();

    this.machineLearningTrainingService.types().subscribe({
      next: (types: any[]) => {

        this.types = types.map(x => x.type);
        this.getItems();
      },
      error: (error: any) => {

        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        this.generalService.hideLoading();
      }
    });

    this.openAIService.key().subscribe({
      next: (result: any) => {

        this.key = result.result;
        this.getModels();
      },
      error: (error: any) => {

        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        this.generalService.hideLoading();
      }
    });
  }

  apiKeyChanged() {

    this.generalService.showLoading();
    this.openAIService.configure(
      this.key,
      this.selectedModel.name,
      this.max_tokens,
      this.temperature).subscribe({
      next: () => {

        this.generalService.showFeedback('Your OpenAI API key was saved to your configuration', 'successMessage');

        // To allow for configuration to kick in we need to sleep for 1 second
        setTimeout(() => {

          this.getTrainingStatus();

        }, 1000);
      },
      error: (error: any) => {

        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  showDetails(el: any) {
    console.log(el);
  }

  page(event: PageEvent) {

    this.filter.offset = event.pageIndex * event.pageSize;
    this.getItems(false);
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
    this.getItems(true);
  }

  /*
   * Private helper methods.
   */

  private getItems(count: boolean = true) {

    this.machineLearningTrainingService.list(this.filter).subscribe({
      next: (result: any[]) => {

        this.dataSource = result || [];
        if (count) {

          const countFilter: any = {};
          for (const idx in this.filter) {
            if (idx !== 'limit' && idx !== 'offset') {
              countFilter[idx] = this.filter[idx];
            }
          }
      
          this.machineLearningTrainingService.count(countFilter).subscribe({
            next: (result: any) => {

              this.count = result.count;
              this.isLoadingGrid = false;
            },
            error: (error: any) => {

              this.generalService.showFeedback(error, 'errorMessage', 'Ok');
              this.isLoadingGrid = false;
              this.generalService.hideLoading();
            }
          });
        }
      },
      error: (error: any) => {

        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        this.isLoadingGrid = false;
        this.generalService.hideLoading();
      }
    });
  }

  private getModels() {

    this.openAIService.base_models().subscribe({
      next: (result: any[]) => {

        this.models = result;

        if (!this.key) {

          this.generalService.hideLoading();
          this.selectedModel = this.models[0];
          this.isLoadingConfig = false;
          return;
        }

        this.getTrainingStatus();
      },
      error: (error: any) => {

        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        this.isLoadingConfig = false;
        this.generalService.hideLoading();
      }
    });
  }

  private getTrainingStatus() {

    this.openAIService.get_training_status().subscribe({
      next: (result: any[]) => {

        this.generalService.hideLoading();
        result = result || [];
        if (result.length > 0) {

          // Verifying we've got trained models.
          result.sort((lhs, rhs) => {
            if (lhs.created > rhs.created) {
              return -1;
            }
            if (lhs.created < rhs.created) {
              return 1;
            }
            return 0;
          });

          // Filtering in only models that succeeded their training.
          const succeeded = result.filter(x => x.status === 'succeeded');

          // Checking if there are models being trained.
          if (result.filter(x => x.status === 'running').length > 0) {
            this.generalService.showFeedback('You have models currently in training');
          }

          if (succeeded.length > 0) {
            this.models = succeeded
              .map(x => {
                return {
                  name: x.fine_tuned_model,
                  description: 'Fine tuned model',
                }
              })
              .concat(this.models);
            this.selectedModel = this.models[0];
          }
        }
      },
      error: (error: any) => {

        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }
}
