/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LastLogItems } from 'src/app/models/dashboard.model';
import { ViewLogComponent } from '../view-log/view-log.component';

@Component({
  selector: 'app-last-log-items',
  templateUrl: './last-log-items.component.html',
  styleUrls: ['./last-log-items.component.scss']
})
export class LastLogItemsComponent implements OnInit, OnChanges {

  /**
   * Actual data received from the parent component.
   */
  @Input() data: LastLogItems[] = [];

  /**
   * Number of total logs passing from the parent component.
   */
  @Input() totalLogs: number = 0;

  /**
   * Column titles to be displayed in the table.
   */
  displayedColumns: string[] = ['created', 'type', 'content', 'more'];

  /**
   * Data to be displayed inside the table.
   */
  dataSource: any;

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
    this.watingData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.watingData();
  }

  /**
   * Waiting for the data to reach from the parent component.
   */
  watingData() {
    (async () => {
      while (this.data === null)
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.data && this.data.length > 0) {
        this.dataSource = this.data;
      }
    })();
  }

  /**
   * To show the full details.
   * @param log All information about the selected log.
   */
  viewLog(log: LastLogItems) {
    this.dialog.open(ViewLogComponent, {
      width: '650px',
      data: log
    })
  }
}
