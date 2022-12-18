
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { GeneralService } from 'src/app/_general/services/general.service';
import { LogService } from '../../../../_general/services/log.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { LogItem } from './_models/log-item.model';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { LogItemDetailsComponent } from '../../../../_general/components/log-item-details/log-item-details.component';

@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.scss']
})
export class LogComponent implements OnInit {

  /**
   * Columns to display in table.
   */
  displayedColumns: string[] = ['id', 'date', 'content', 'type', 'action'];

  /**
   * Currently viewed log items.
   */
  expandedElement: LogItem | null;

  /**
   * Number of log items in the backend matching the currently applied filter.
   */
  count: number = 0;

  public isLoading: boolean = true;

  public pageSize: number = 10;
  public currentPage: number = 0;

  public dataSource: any = [];
  private filter: string = '';

  /**
   * Creates an instance of your component.
   *
   * @param generalService Needed to display feedback to user
   * @param logService Log HTTP service to use for retrieving log items
   * @param clipboard Needed to be able to access the clipboard
   */
  constructor(
    private dialog: MatDialog,
    private generalService: GeneralService,
    private logService: LogService,
    private clipboard: Clipboard) { }

  /**
   * OnInit implementation.
   */
  ngOnInit() {
    this.getItems();
    this.getCount();
  }

  /**
   * Returns log items from your backend.
   */
  getItems() {
    let from: string = null;
    if (this.currentPage > 0) {
      from = this.dataSource[this.dataSource.length - 1].id;
    }
    this.logService.list(from, this.pageSize, this.filter).subscribe({
      next: (logitems) => {
        this.dataSource = logitems || [];
        this.isLoading = false;
      },
      error: (error: any) => {
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }

  getCount() {
    this.logService.count(this.filter).subscribe({
      next: (count) => {
        this.count = count.count;
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  page(event: PageEvent) {

    this.currentPage = event.pageIndex;
    this.getItems();
  }

  viewException(item: any) {
    this.dialog.open(LogItemDetailsComponent, {
      width: '700px',
      data: item
    })
  }

  /**
   * Puts the specified content into the user's clipboard
   *
   * @param content Content to put on to clipboard
   */
  copyContent(content: string) {
    this.clipboard.copy(content);
    this.generalService.showFeedback('Contentis copied on your clipboard');
  }

  public filterList(filter: any) {    
    this.filter = filter;
    this.currentPage = 0;
    this.getItems();
    this.getCount();
  }
}
