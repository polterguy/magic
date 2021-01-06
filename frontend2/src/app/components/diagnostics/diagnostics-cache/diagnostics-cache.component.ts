
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { Component, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { CacheService } from 'src/app/services/cache.service';
import { FeedbackService } from 'src/app/services/feedback.service';

/**
 * Cache component for allowing user to inspect, remove, and purge cache items.
 */
@Component({
  selector: 'app-diagnostics-cache',
  templateUrl: './diagnostics-cache.component.html',
  styleUrls: ['./diagnostics-cache.component.scss']
})
export class DiagnosticsCache implements OnInit {

  /**
   * Filter for what items to display.
   */
  public filter: any = {};

  /**
   * List of cache items as returned from backend.
   */
  public cacheItems: any[] = [];

  /**
   * Number of users matching filter in the backend.
   */
  public count: number = 0;

  /**
   * Currently selected items.
   */
  public selectedCacheItems: string[] = [];

  /**
   * Filter form control for filtering users to display.
   */
  public filterFormControl: FormControl;

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatPaginator, {static: true}) public paginator: MatPaginator;

  /**
   * Creates an instance of your component.
   * 
   * @param cacheService Needed to read, remove and purge cache
   */
  constructor(
    private cacheService: CacheService,
    private feedbackService: FeedbackService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Creating our filtering control.
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.paginator.pageIndex = 0;
        this.getItems();
      });

    // Retrieving initial items from backend.
    this.getItems();
  }

  /**
   * Retrieves items from backend and databinds table.
   */
  public getItems() {

    // Updating filter value.
    this.filter.filter = this.filterFormControl.value;
    this.filter.offset = this.paginator.pageIndex * this.paginator.pageSize;
    this.filter.limit = this.paginator.pageSize;

    // Invoking backend to retrieve cache items.
    this.cacheService.list(this.filter).subscribe((items: any[]) => {

      // Dynamically building our dataset.
      const arr = [];
      for(const idx in items) {
        arr.push({
          key: idx,
          value: items[idx]
        });
      }
      this.cacheItems = arr;

      // Invoking backend to count items matching filter.
      this.cacheService.count(this.filter.filter).subscribe((count: Count) => {
        this.count = count.count;
      });
    });
  }

  /**
   * Invoked when cache items are paged.
   */
  public paged() {
    this.getItems();
  }

  /**
   * Invoked when user wants to clear current filter condition.
   */
  public clearFilter() {

    // Setting value of form control will automatically retrieve items.
    this.filterFormControl.setValue('');
  }

  /**
   * Toggles the details view for a single cache item.
   * 
   * @param item Cache item to toggle details for
   */
  public toggleDetails(item: any) {

    // Checking if we're already displaying details for current item.
    const idx = this.selectedCacheItems.indexOf(item.key);
    if (idx !== -1) {

      // Hiding item.
      this.selectedCacheItems.splice(idx, 1);
    } else {

      // Displaying item.
      this.selectedCacheItems.push(item.key);
    }
  }

  /**
   * Returns true if we should display the details view for specified cache item.
   * 
   * @param item Item to check if we should display details for
   */
  public shouldDisplayDetails(item: any) {

    // Returns true if we're currently displaying this particular item.
    return this.selectedCacheItems.filter(x => x === item.key).length > 0;
  }


  /**
   * Deletes the specified cache item.
   * 
   * @param id ID or key of item to delete
   */
  public delete(event: any, id: string) {

    // Making sure the event doesn't propagate upwards, which would trigger the row click event.
    event.stopPropagation();

    // Invoking backend to delete item.
    this.cacheService.delete(id).subscribe(() => {

      // Showing some information to user, and re-databinding table.
      this.feedbackService.showInfoShort('Cache item deleted');
      this.getItems();
    });
  }

  /**
   * Purges cache completely, deleting all items from cache.
   */
  public deleteAll() {

    // Getting confirmation from user that he really wants to purge cache.
    this.feedbackService.confirm(
      'Please confirm action',
      `Are you sure you want to purge your cache? Purging your cache will delete ${this.cacheItems.length} items.`,
      () => {

        // Invoking backend to delete all items.
        this.cacheService.deleteAll().subscribe(() => {

          // Showing some information to user, and re-databinding table.
          this.feedbackService.showInfoShort('Cache purged');
          this.getItems();
        });
      });
  }
}
