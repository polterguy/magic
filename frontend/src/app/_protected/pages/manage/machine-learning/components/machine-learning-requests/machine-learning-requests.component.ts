
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MachineLearningTrainingService } from 'src/app/_general/services/machine-learning-training.service';
import { MachineLearningEditRequestComponent } from '../machine-learning-edit-request/machine-learning-edit-request.component';

/**
 * Helper component to view and manage Machine Learning requests
 */
@Component({
  selector: 'app-machine-learning-requests',
  templateUrl: './machine-learning-requests.component.html',
  styleUrls: ['./machine-learning-requests.component.scss']
})
export class MachineLearningRequestsComponent implements OnInit {

  type: string = null;

  dataSource: any[] = null;
  count: number = 0;
  types: string[] = null;
  displayedColumns: string[] = [
    'prompt',
    'type',
    'finish_reason',
    'action',
  ];
  filter: any = {
    limit: 10,
    offset: 0,
  };

  constructor(
    private dialog: MatDialog,
    private generalService: GeneralService,
    private machineLearningTrainingService: MachineLearningTrainingService) { }

  ngOnInit() {

    this.getTypes(true);
  }

  filterList(event: { searchKey: string, type?: string }) {

    this.filter = {
      limit: this.filter.limit,
      offset: 0,
    };
    if (event.searchKey) {
      this.filter['ml_requests.prompt.like'] = '%' + event.searchKey + '%';
    }
    if (event.type) {
      this.filter['ml_requests.type.eq'] = event.type;
    }
    this.getRequests(true);
  }

  page(event: PageEvent) {

    this.filter.offset = event.pageIndex * event.pageSize;
    this.getRequests(false);
  }

  showDetails(el: any) {

    this.dialog
      .open(MachineLearningEditRequestComponent, {
        width: '80vw',
        maxWidth: '850px',
        disableClose: true,
        data: {
          id: el.id,
          prompt: el.prompt,
          completion: el.completion,
          type: el.type,
        },
      })
      .afterClosed()
      .subscribe((result: any) => {

        if (result) {

          this.machineLearningTrainingService.ml_requests_update(result).subscribe({
            next: () => {

              this.generalService.showFeedback('Request updated successfully', 'successMessage');
              this.getRequests();
            },
            error: () => this.generalService.showFeedback('Something went wrong as we tried to update your request', 'errorMessage')
          });
        }
    });
  }

  delete(el: any) {

    this.generalService.showLoading();
    this.machineLearningTrainingService.ml_requests_delete(el.id).subscribe({
      next: () => {

        this.generalService.showFeedback('Request successfully deleted', 'successMessage');
        this.getRequests(true);
      },
      error: (error: any) => {

        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        this.generalService.hideLoading();
      }
    });
  }

  /*
   * Private helper methods.
   */

  private getTypes(getTrainingData: boolean = true) {

    this.machineLearningTrainingService.ml_types().subscribe({
      next: (types: any[]) => {

        types = types || [];

        this.types = types.map(x => x.type);

        if (getTrainingData) {
          this.getRequests();
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

  private getRequests(count: boolean = true) {

    this.machineLearningTrainingService.ml_requests(this.filter).subscribe({
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
    
        this.machineLearningTrainingService.ml_requests_count(countFilter).subscribe({
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
