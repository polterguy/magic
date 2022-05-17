/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LastLogItems } from 'src/app/models/dashboard.model';
import { ViewLogComponent } from '../view-log/view-log.component';

@Component({
  selector: 'app-last-log-items',
  templateUrl: './last-log-items.component.html',
  styleUrls: ['./last-log-items.component.scss']
})
export class LastLogItemsComponent implements OnInit {

  @Input() data: LastLogItems[] = [];
  @Input() totalLogs: number = 0;

  displayedColumns: string[] = ['created', 'type', 'content', 'more'];
  dataSource;
  
  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
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

  viewLog(log: LastLogItems) {
    this.dialog.open(ViewLogComponent, {
      width: '650px',
      data: log
    })
  }
}
