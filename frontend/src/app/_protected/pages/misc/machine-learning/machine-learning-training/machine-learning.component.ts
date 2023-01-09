
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
  filter: string = '';
  count: number = 0;
  index: number = 0;
  pageSize: number = 10;
  displayedColumns: string[] = [
    'type',
    'prompt',
    'pushed',
    'action',
  ];
  key: string = null;
  selectedModel: any = null;
  models: any[] = [];

  constructor(
    private generalService: GeneralService,
    private openAIService: OpenAIService,
    private machineLearningTrainingService: MachineLearningTrainingService) { }

  ngOnInit() {
    this.isLoadingGrid = true;
    this.isLoadingConfig = true;
    this.getItems();

    this.openAIService.key().subscribe({
      next: (result: any) => {

        this.key = result.result;
        this.getModels();
      },
      error: (error: any) => {
        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
      }
    });
  }

  showDetails(el: any) {
    console.log(el);
  }

  page(event: PageEvent) {
    this.index = event.pageIndex;
    this.getItems(false);
  }

  filterList(event: {searchKey: string}) {
    this.filter = event.searchKey;
    this.index = 0;
    this.getItems(true);
  }

  /*
   * Private helper methods.
   */

  getItems(count: boolean = true) {
    const filter: any = {
      limit: this.pageSize,
    };
    if (this.index !== 0) {
      filter.offset = this.index * this.pageSize;
    }
    if (this.filter?.length > 0) {
      filter['ml_training_snippets.prompt.like'] = this.filter;
      filter['ml_training_snippets.type.eq'] = this.filter;
    }

    this.machineLearningTrainingService.list(filter).subscribe({
      next: (result: any[]) => {

        this.dataSource = result || [];
        if (count) {

          const countFilter: any = { };
          if (this.filter?.length > 0) {
            countFilter['ml_training_snippets.prompt.like'] = this.filter;
            countFilter['ml_training_snippets.type.eq'] = this.filter;
          }
      
          this.machineLearningTrainingService.count(countFilter).subscribe({
            next: (result: any) => {
              this.count = result.count;
              this.isLoadingGrid = false;
            },
            error: (error: any) => {
              this.generalService.showFeedback(error, 'errorMessage', 'Ok');
              this.isLoadingGrid = false;
            }
          });
        }
      },
      error: (error: any) => {

        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        this.isLoadingGrid = false;
      }
    });
  }

  private getModels() {
    this.openAIService.base_models().subscribe({
      next: (result: any[]) => {

        this.models = result;

        if (!this.key) {
          this.isLoadingConfig = false;
          return;
        }

        this.openAIService.get_training_status().subscribe({
          next: (result: any[]) => {

            this.models = result.map(x => {
              return {
                name: x.fine_tuned_model,
                description: 'Fine tuned custom model',
              };
            }).concat(this.models);

            this.isLoadingConfig = false;
          },
          error: (error: any) => {

            this.generalService.showFeedback(error, 'errorMessage', 'Ok');
            this.isLoadingConfig = false;
          }
        });
      },
      error: (error: any) => {

        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        this.isLoadingConfig = false;
      }
    });
  }
}
