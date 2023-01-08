
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MachineLearningTrainingService } from 'src/app/_general/services/machine-learning-training.service';

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

  isLoading: boolean = false;
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

  constructor(
    private generalService: GeneralService,
    private machineLearningTrainingService: MachineLearningTrainingService) { }

  ngOnInit() {
    this.isLoading = true;
    this.getItems();
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
      filter['training_snippets.prompt.like'] = this.filter;
      filter['training_snippets.type.eq'] = this.filter;
    }

    this.machineLearningTrainingService.list(filter).subscribe({
      next: (result: any[]) => {

        this.dataSource = result || [];
        if (count) {

          const countFilter: any = { };
          if (this.filter?.length > 0) {
            countFilter['training_snippets.prompt.like'] = this.filter;
            countFilter['training_snippets.type.eq'] = this.filter;
          }
      
          this.machineLearningTrainingService.count(countFilter).subscribe({
            next: (result: any) => {
              this.count = result.count;
              this.isLoading = false;
            },
            error: (error: any) => {
              this.generalService.showFeedback(error, 'errorMessage', 'Ok');
              this.isLoading = false;
            }
          });
        }
      },
      error: (error: any) => {

        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        this.isLoading = false;
      }
    });
  }
}
