/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LastLogItems } from 'src/app/models/dashboard.model';
import { LogItemDialogComponent } from 'src/app/components/protected/common/log-item-dialog/log-item-dialog.component';

/**
 * Helper component for displaying latest log items from the dashboard.
 */
@Component({
  selector: 'app-last-log-items',
  templateUrl: './last-log-items.component.html',
  styleUrls: ['./last-log-items.component.scss']
})
export class LastLogItemsComponent implements OnInit, OnChanges {

  @Input() data: LastLogItems[] = [];
  @Input() totalLogs: number = 0;

  displayedColumns: string[] = ['created', 'type', 'content', 'more'];
  dataSource: any;

  constructor(private dialog: MatDialog) { }

  ngOnInit() {

    this.watingData();
  }

  ngOnChanges() {

    this.watingData();
  }

  watingData() {

    (async () => {
      while (this.data === null)
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.data && this.data.length > 0) {
        this.dataSource = this.data;
      }
    })();
  }

  viewLog(item: any) {

    this.dialog.open(LogItemDialogComponent, {
      width: '700px',
      data: item
    })
  }
}

