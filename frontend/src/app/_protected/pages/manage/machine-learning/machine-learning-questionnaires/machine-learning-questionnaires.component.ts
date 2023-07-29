
/*
 * Copyright (c) Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MachineLearningTrainingService } from 'src/app/_general/services/machine-learning-training.service';

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
    private generalService: GeneralService) { }

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

  addType() {

    console.log('foo');
  }

  edit(el: any) {

    console.log(el);
  }

  delete(el: any) {

    console.log(el);
  }

  private getData() {

    // Getting questionnaires.
    this.machineLearningTrainingService.questionnaires(this.filter).subscribe({

      next: (result: any[]) => {

        this.dataSource = result || [];

        // Getting count of items.
        this.machineLearningTrainingService.questionnaires_count({
          ['questionnaires.name.like']: this.filter.name,
        }).subscribe({

          next: (result: any) => {

            this.count = result.count;
          },

          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? 'Something went wrong as we tried to count questionnaires', 'errorMessage', 'Ok', 5000)
        });
      },

      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? 'Something went wrong as we tried to retrieve questionnaires', 'errorMessage', 'Ok', 5000)
    });
  }
}
