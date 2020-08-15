
import { Component, OnInit } from '@angular/core';
import { LogService } from 'src/app/services/log-service';
import { LogItem } from 'src/app/models/log-item';
import { PageEvent, MatDialog } from '@angular/material';
import { ViewLogDetails } from './modals/view-log-details';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit {

  public offset = 0;
  public limit = 10;
  public items: LogItem[] = null;
  public count: number;
  public noErrors = 0;
  public displayedColumns: string[] = ['when', 'type', 'content', 'details'];

  constructor(
    private logService: LogService,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.getItems();
  }

  getItems() {
    this.logService.listLogItems(this.offset, this.limit).subscribe(res => {
      this.items = res;
    });
    this.logService.countLogItems().subscribe(res => {
      this.count = res.result;
    });
    this.logService.countErrorItems().subscribe(res => {
      this.noErrors = res.result;
    });
  }

  paged(e: PageEvent) {
    this.offset = e.pageSize * e.pageIndex;
    this.getItems();
  }

  showDetails(item: LogItem) {
    this.dialog.open(ViewLogDetails, {
      width: '80%',
      data: item
    });
  }
}
