
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { Component, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// Application specific imports.
import { LogItem } from 'src/app/models/log-item';
import { LogService } from 'src/app/services/log-service';

/**
 * Log component for reading backend's log.
 */
@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.scss']
})
export class LogComponent implements OnInit {

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  public filterFormControl: FormControl;
  public displayedColumns: string[] = ['when', 'type', 'content', 'details'];
  public items: LogItem[] = [];
  public count: number = 0;

  /**
   * Creates an instance of your component.
   * 
   * @param logService Log HTTP service to use for retrieving log items
   */
  constructor(private logService: LogService) { }

  /**
   * OnInit implementation.
   */
  ngOnInit() {
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: any) => {
        this.filterFormControl.setValue(query);
        this.paginator.pageIndex = 0;
        this.getItems();
      });
    this.getItems();
  }

  /**
   * Returns log items from your backend.
   */
  public getItems() {
    this.logService.list(
      this.filterFormControl.value,
      this.paginator.pageIndex * this.paginator.pageSize,
      this.paginator.pageSize).subscribe(res => {
      this.items = res;
      this.logService.count(this.filterFormControl.value).subscribe(res => {
        this.count = res.result;
      })
    });
  }

  /**
   * Invoked when paginator wants to page data table.
   * 
   * @param e Page event argument
   */
  public paged(e: PageEvent) {
    this.paginator.pageSize = e.pageSize;
    this.getItems();
  }

  /**
   * Invoked when filter is programmatically changed for some reasons
   * 
   * @param filter Query filter to use for displaying items
   */
  public setFilter(filter: string) {
    this.paginator.pageIndex = 0;
    this.filterFormControl.setValue(filter);
    this.getItems();
  }

  clearFilter() {
    this.paginator.pageIndex = 0;
    this.filterFormControl.setValue('');
    this.getItems();
  }
}
