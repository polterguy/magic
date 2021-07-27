
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { ActivatedRoute, Params } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// Application specific imports.
import { FeedbackService } from '../../services/feedback.service';
import { LogItem } from 'src/app/components/log/models/log-item.model';
import { LogService } from 'src/app/components/log/services/log.service';

/**
 * Log component for reading backend's log.
 */
@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.scss']
})
export class LogComponent implements OnInit {

  // List of log item IDs that we're currently viewing details for.
  private displayDetails: number[] = [];

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatPaginator, {static: true}) public paginator: MatPaginator;

  /**
   * Columns to display in table.
   */
  public displayedColumns: string[] = ['content', 'type', 'when'];

  /**
   * Filter form control for filtering log items to display.
   */
  public filterFormControl: FormControl;

  /**
   * Currently viewed log items.
   */
  public items: LogItem[] = [];

  /**
   * Number of log items in the backend matching the currently applied filter.
   */
  public count: number = 0;

  /**
   * Currently viewed log item. Basically the log item emphasized and displayed at the top of component.
   */
  public current: LogItem = null;

  /**
   * Creates an instance of your component.
   * 
   * @param feedbackService Needed to display feedback to user
   * @param logService Log HTTP service to use for retrieving log items
   * @param clipboard Needed to be able to access the clipboard
   * @param route Activated route service to subscribe to router changed events
   */
  constructor(
    private feedbackService: FeedbackService,
    private logService: LogService,
    private clipboard: Clipboard,
    private route: ActivatedRoute) { }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    // Making sure we subscribe to router changed events.
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

    // Creating our filter form control, with debounce logic.
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: any) => {
        this.filterFormControl.setValue(query);
        this.paginator.pageIndex = 0;
        this.getItems();
      });

    // Retrieving relevant query parameters.
    this.route.queryParams.subscribe((params: Params) => {

      // Retrieving filter query param, and if given, applying filter for which items to retrieve.
      const filter = params['filter'];
      if (filter) {
        this.filterFormControl.setValue(filter);
      } else {

        // Getting log items initially, displaying the latest log items from the backend.
        this.getItems();
      }
    });
  }

  /**
   * Returns log items from your backend.
   */
  public getItems() {

    // Retrieves log items from the backend according to pagination and filter conditions.
    this.logService.list(
      this.filterFormControl.value,
      this.paginator.pageIndex * this.paginator.pageSize,
      this.paginator.pageSize).subscribe(logitems => {

      // Resetting details to avoid having 'hanging' details items, and changing internal model to result of invocation.
      this.displayDetails = [];
      this.items = logitems;

      // Counting items with the same filter as we used to retrieve items with.
      this.logService.count(this.filterFormControl.value).subscribe(count => {

        // Assigning count to returned value from server.
        this.count = count.count;

      }, (error: any) => this.feedbackService.showError(error));
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when paginator wants to page data table.
   * 
   * @param e Page event argument
   */
  public paged(e: PageEvent) {

    // Changing pager's size according to arguments, and retrieving log items from backend.
    this.paginator.pageSize = e.pageSize;
    this.getItems();
  }

  /**
   * Invoked when filter is programmatically changed for some reasons
   * 
   * @param filter Query filter to use for displaying items
   */
  public setFilter(filter: string) {

    // Updating page index, and taking advantage of debounce logic on form control to retrieve items from backend.
    this.paginator.pageIndex = 0;
    this.filterFormControl.setValue(filter);
  }

  /**
   * Clears the current filter.
   */
  public clearFilter() {

    // Updating page index, and taking advantage of debounce logic on form control to retrieve items from backend.
    this.paginator.pageIndex = 0;
    this.filterFormControl.setValue('');
  }

  /**
   * Toggles details about one specific log item.
   * 
   * @param el Log item to toggle details for
   */
  public toggleDetails(el: LogItem) {

    // Checking if we're already displaying details for current item.
    const idx = this.displayDetails.indexOf(el.id);
    if (idx !== -1) {

      // Hiding item.
      this.displayDetails.splice(idx, 1);
    } else {

      // Displaying item.
      this.displayDetails.push(el.id);
    }
  }

  /**
   * Returns true if details for specified log item should be displayed.
   * 
   * @param el Log item to display details for
   */
  public shouldDisplayDetails(el: LogItem) {

    // Returns true if we're currently displaying this particular item.
    return this.displayDetails.filter(x => x === el.id).length > 0;
  }

  /**
   * Shows information about where to find currently viewed item.
   */
  public showLinkTip() {
    this.feedbackService.showInfo('Scroll to the top of the page to see the item');
  }

  /**
   * Puts the specified content into the user's clipboard
   * 
   * @param content Content to put on to clipboard
   */
  public copyContent(content: string) {

    // Putting content to clipboard and giving user some feedback.
    this.clipboard.copy(content);
    this.feedbackService.showInfoShort('The specified content can be found on your clipboard');
  }
}
