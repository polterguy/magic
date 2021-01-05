
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { CacheService } from 'src/app/services/cache.service';
import { FeedbackService } from 'src/app/services/feedback.service';

/**
 * Cache component for allowing user to inspect, remove and clear cache items.
 */
@Component({
  selector: 'app-config-cache',
  templateUrl: './config-cache.component.html',
  styleUrls: ['./config-cache.component.scss']
})
export class ConfigCacheComponent implements OnInit {

  /**
   * List of cache items as returned from backend.
   */
  public cacheItems: any[] = [];

  /**
   * Currently selected items.
   */
  public selectedCacheItems: string[] = [];

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

    // Retrieving initial items from backend.
    this.getItems();
  }

  /**
   * Retrieves items from backend and databinds table.
   */
  public getItems() {

    // Invoking backend to retrieve cache items.
    this.cacheService.list().subscribe((items: any[]) => {

      // Dynamically building our dataset.
      const arr = [];
      for(const idx in items) {
        arr.push({
          key: idx,
          value: items[idx]
        });
      }
      this.cacheItems = arr;
    });
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

    // Invoking backend to delete all items.
    this.cacheService.deleteAll().subscribe(() => {

      // Showing some information to user, and re-databinding table.
      this.feedbackService.showInfoShort('Cache purged');
      this.getItems();
    });
  }
}
