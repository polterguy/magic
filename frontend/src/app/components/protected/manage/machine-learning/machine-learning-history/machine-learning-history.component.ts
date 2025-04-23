
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { ConfirmationDialogComponent } from 'src/app/components/protected/common/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/services/general.service';
import { MachineLearningTrainingService } from 'src/app/services/machine-learning-training.service';
import { MachineLearningEditCacheComponent } from '../components/machine-learning-edit-history/machine-learning-edit-history.component';
import { FilterComponent } from 'src/app/components/protected/common/filter/filter.component';
import { MachineLearningViewConversationComponent } from '../components/machine-learning-view-conversation/machine-learning-view-conversation.component';

/**
 * Helper component to view and manage Machine Learning requests
 */
@Component({
  selector: 'app-machine-learning-history',
  templateUrl: './machine-learning-history.component.html',
  styleUrls: ['./machine-learning-history.component.scss']
})
export class MachineLearningRequestsComponent implements OnInit {

  type: string = null;

  dataSource: any[] = null;
  count: number = 0;
  types: string[] = null;
  displayedColumns: string[] = [
    'prompt',
    'user_id',
    'type',
    'created',
    'finish_reason',
    'action',
  ];
  filter: any = {
    limit: 10,
    offset: 0,
    order: 'created',
    direction: 'desc',
  };
  @ViewChild('searchBox') searchBox: FilterComponent;

  constructor(
    private dialog: MatDialog,
    private generalService: GeneralService,
    private machineLearningTrainingService: MachineLearningTrainingService) { }

  ngOnInit() {

    this.getTypes(true);
  }

  filterOnUserId(event:any, user: string) {

    this.searchBox.setSearchTerm(user);
    event.preventDefault();
  }

  filterList(event: { searchKey: string, type?: string }) {

    const newFilter: any = {
      limit: this.filter.limit,
      offset: 0,
    };
    if (this.filter.order) {
      newFilter.order = this.filter.order;
    }
    if (this.filter.direction) {
      newFilter.direction = this.filter.direction;
    }
    this.filter = newFilter;
    if (event.searchKey) {
      this.filter['filter'] = event.searchKey;
    }
    if (event.type) {
      this.filter['ml_requests.type.eq'] = event.type;
    }
    this.generalService.showLoading();
    this.getRequests(true);
  }

  getStatus (st: string) {
    switch (st) {

      case 'stop':
        return 'stop';

      case 'lead':
        return 'lead';

      case 'cached':
        return 'cached';

      default:
        return st;

    }
  }

  exportLeads() {

    this.machineLearningTrainingService.ml_export_leads({
      type: this.type,
    });
  }

  exportQuestionnaires() {

    this.machineLearningTrainingService.ml_export_questionnaires({
      type: this.type,
    });
  }

  exportConversations() {

    this.machineLearningTrainingService.ml_export_conversations({
      type: this.type,
    });
  }

  exportConversation() {

    var filter = {
      ['ml_requests.type.eq']: this.filter['ml_requests.type.eq'],
      filter: this.filter.filter,
      limit: 100,
      order: 'created',
      direction: 'asc',
    };

    this.generalService.showLoading();
    this.machineLearningTrainingService.ml_requests(filter).subscribe({
      next: (res: any[]) => {

        this.generalService.hideLoading();

        // Checking if we've got more than 100 items.
        if (res.length >= 100) {
          this.generalService.showFeedback('Warning! There was more than 100 items in result, only showing the first 100 items.', 'errorMessage');
        }

        let result = '';
        res.forEach(idx => {
          result += 'User: ' + idx.prompt + '\r\n\r\n' + 'Machine: ' + (!idx.completion || idx.completion === '' ? '**ERROR**!!' : idx.completion) + '\r\n\r\n';
        });
        this.dialog
        .open(MachineLearningViewConversationComponent, {
          width: '80vw',
          maxWidth: '850px',
          data: {
            conversation: result,
            warning: res.length >= 100,
          },
        });
      },
      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message, 'errorMessage', 'Ok');
      }
    });
  }

  sortData(e: any) {

    if (e.direction === '') {

      delete this.filter['order'];
      delete this.filter['direction'];
      this.getRequests(false);
      return;
    }

    this.filter['order'] = e.active;
    this.filter['direction'] = e.direction;
    this.getRequests(false);
  }

  page(event: PageEvent) {

    this.filter.offset = event.pageIndex * event.pageSize;
    this.getRequests(false);
  }

  showDetails(el: any) {

    this.dialog
      .open(MachineLearningEditCacheComponent, {
        width: '80vw',
        maxWidth: '850px',
        data: {
          id: el.id,
          prompt: el.prompt,
          completion: el.completion,
          type: el.type,
          cached: el.cached,
          referrer: el.referrer,
        },
      })
      .afterClosed()
      .subscribe((result: any) => {

        if (result) {

          this.generalService.showLoading();
          this.machineLearningTrainingService.ml_requests_update(result).subscribe({
            next: () => {

              this.generalService.showFeedback('Request updated successfully', 'successMessage');
              this.getRequests();
            },
            error: () => {

              this.generalService.hideLoading();
              this.generalService.showFeedback('Something went wrong as we tried to update your request', 'errorMessage');
            }
          });
        }
    });
  }

  delete(el: any) {

    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: 'Delete request',
        description_extra: 'Are you sure you want to delete this request?',
        action_btn: 'Delete',
        close_btn: 'Cancel',
        action_btn_color: 'warn',
        bold_description: true,
      }
    }).afterClosed().subscribe((result: string) => {

      if (result === 'confirm') {

        this.generalService.showLoading();
        this.machineLearningTrainingService.ml_requests_delete(el.id).subscribe({
          next: () => {
    
            this.generalService.showFeedback('Request successfully deleted', 'successMessage');
            this.getRequests(true);
          },
          error: (error: any) => {
    
            this.generalService.showFeedback(error?.error?.message, 'errorMessage', 'Ok');
            this.generalService.hideLoading();
          }
        });
      }
    });
  }

  /*
   * Private helper methods.
   */

  private getTypes(getTrainingData: boolean = true) {

    this.machineLearningTrainingService.ml_types({
      limit: -1,
    }).subscribe({
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

        this.generalService.showFeedback(error?.error?.message, 'errorMessage', 'Ok');
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
          if (idx !== 'limit' && idx !== 'offset' && idx !== 'order' && idx !== 'direction') {
            countFilter[idx] = this.filter[idx];
          }
        }
    
        this.machineLearningTrainingService.ml_requests_count(countFilter).subscribe({
          next: (result: any) => {

            this.count = result.count;
            this.generalService.hideLoading();
          },
          error: (error: any) => {

            this.generalService.showFeedback(error?.error?.message, 'errorMessage', 'Ok');
            this.generalService.hideLoading();
          }
        });
      },
      error: (error: any) => {

        this.generalService.showFeedback(error?.error?.message, 'errorMessage', 'Ok');
        this.generalService.hideLoading();
      }
    });
  }
}
