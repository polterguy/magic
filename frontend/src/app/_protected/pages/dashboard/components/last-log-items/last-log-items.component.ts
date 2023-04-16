/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LastLogItems } from 'src/app/models/dashboard.model';
import { LogItemDetailsComponent } from 'src/app/_general/components/log-item-details/log-item-details.component';

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

    this.dialog.open(LogItemDetailsComponent, {
      width: '700px',
      data: item
    })
  }
}

