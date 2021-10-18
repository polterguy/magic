
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatPaginator } from '@angular/material/paginator';
import { Component, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { CacheItem } from './models/cache-item.model';
import { FeedbackService } from 'src/app/services/feedback.service';
import { CacheService } from 'src/app/components/diagnostics/diagnostics-cache/services/cache.service';
import { AuthService } from '../../auth/services/auth.service';

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
   * @param clipboard Used to copy content of cache item to clipboard
   * @param authService Needed to verify user has access to components
   * @param cacheService Needed to read, remove and clear cache
   * @param feedbackService Needed to display feedback information to user
   */
  constructor(
    private clipboard: Clipboard,
    public authService: AuthService,
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
    this.cacheService.list(this.filter).subscribe((items: CacheItem[]) => {

      // Assigning result of backend invocation to model.
      this.cacheItems = items || [];

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
   * Invoked when user wants to copy value of cache entry.
   * 
   * @param value Value to copy
   */
  public copyContent(value: string) {

    // Copying specified string to clipboard and gives user some information.
    this.clipboard.copy(value);
    this.feedbackService.showInfoShort('Value was copied to your clipboard');
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
      `Are you sure you want to purge your cache? Purging your cache will delete ${this.count} items.`,
      () => {

        // Invoking backend to delete all items.
        this.cacheService.deleteAll(this.filterFormControl.value).subscribe(() => {

          // Showing some information to user, and re-databinding table.
          this.feedbackService.showInfoShort('Cache successfully purged');
          this.filterFormControl.setValue('');
        });
      });
  }
}
