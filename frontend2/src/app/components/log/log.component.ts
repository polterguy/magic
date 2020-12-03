
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// Application specific imports.
import { LogItem } from 'src/app/models/log-item.model';
import { Messages } from 'src/app/models/message.model';
import { LogService } from 'src/app/services/log-service';
import { MessageService } from 'src/app/services/message-service';

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
  public displayedColumns: string[] = ['content', 'type', 'when'];
  public filterFormControl: FormControl;
  public items: LogItem[] = [];
  public count: number = 0;
  public showGrid = true;
  public current: LogItem = null;
  private displayDetails: number[] = [];

  /**
   * Creates an instance of your component.
   * 
   * @param logService Log HTTP service to use for retrieving log items
   */
  constructor(
    private logService: LogService,
    private messageService: MessageService,
    private route: ActivatedRoute) { }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.logService.get(id).subscribe(res => {
          this.current = res;
        });
      } else {
        this.current = null;
      }
    });
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
      this.displayDetails = [];
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
  }

  /**
   * Clears the current filter.
   */
  public clearFilter() {
    this.paginator.pageIndex = 0;
    this.filterFormControl.setValue('');
    this.getItems();
  }

  /**
   * Shows details about one specific log item.
   * 
   * @param el Log item to display details for
   */
  public toggleDetails(el: LogItem) {
    const idx = this.displayDetails.indexOf(el.id);
    if (idx >= 0) {
      this.displayDetails.splice(idx, 1);
    } else {
      this.displayDetails.push(el.id);
    }
  }

  /**
   * Returns true if details for specified log item should be displayed.
   * 
   * @param el Log item to display details for
   */
  public shouldDisplayDetails(el: LogItem) {
    return this.displayDetails.filter(x => x === el.id).length > 0;
  }

  /**
   * Shows information about where to find currently viewed item.
   */
  public showLinkTip() {
    this.messageService.sendMessage({
      name: Messages.SHOW_INFO_SHORT,
      content: 'Scroll to the top of the page to see the item'
    });
  }
}
