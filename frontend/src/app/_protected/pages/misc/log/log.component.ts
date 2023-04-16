
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { Component, OnInit } from '@angular/core';
import { GeneralService } from 'src/app/_general/services/general.service';
import { LogService } from '../../../../_general/services/log.service';
import { LogItem } from './_models/log-item.model';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { LogItemDetailsComponent } from '../../../../_general/components/log-item-details/log-item-details.component';

/**
 * Log component, allowing user to search through and view log items.
 */
@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.scss']
})
export class LogComponent implements OnInit {

  private filter: string = '';

  isLoading: boolean = true;
  displayedColumns: string[] = [
    'content',
    'date',
    'id',
    'type',
    'action'
  ];
  dataSource: LogItem[] = [];
  count: number = 0;
  pageSize: number = 10;
  pageOffset: string[] = [];

  constructor(
    private dialog: MatDialog,
    private generalService: GeneralService,
    private logService: LogService) { }

  ngOnInit() {
    this.getItems();
    this.getCount();
  }

  page(event: PageEvent) {
    if (event.previousPageIndex < event.pageIndex) {
      this.pageOffset.push(this.dataSource[this.dataSource.length - 1].id);
    } else {
      this.pageOffset.pop();
    }
    this.getItems();
  }

  showDetails(item: any) {
    this.dialog.open(LogItemDetailsComponent, {
      width: '700px',
      data: item
    })
  }

  filterList(event: {searchKey: string}) {
    this.filter = event.searchKey;
    this.pageOffset = [];
    this.getItems();
    this.getCount();
  }

  /*
   * Private helper methods.
   */

  private getItems() {

    this.logService.list(
      this.pageOffset.length > 0 ? this.pageOffset[this.pageOffset.length - 1] : null,
      this.pageSize,
      this.filter).subscribe({
      next: (logitems) => {

        this.dataSource = logitems || [];
        this.isLoading = false;
      },
      error: (error: any) => {
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }

  private getCount() {

    this.logService.count(this.filter).subscribe({
      next: (count) => {

        this.count = count.count;
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }
}
