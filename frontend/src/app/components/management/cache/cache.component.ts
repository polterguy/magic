
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatPaginator } from '@angular/material/paginator';
import { Component, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { trigger, state, style, transition, animate } from '@angular/animations';

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { CacheItem } from '../../../models/cache-item.model';
import { CacheService } from 'src/app/services/cache.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';

/**
 * Cache component for allowing user to inspect, remove, and purge cache items.
 */
@Component({
  selector: 'app-cache',
  templateUrl: './cache.component.html',
  styleUrls: ['./cache.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('0.75s cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})
export class DiagnosticsCacheComponent implements OnInit {

  /**
   * Filter for what items to display.
   */
  filter: any = {};

  /**
   * List of cache items as returned from backend.
   */
  cacheItems: any[] = [];
  expandedElement: any;

  /**
   * Number of users matching filter in the backend.
   */
  count: number = 0;

  /**
   * Filter form control for filtering users to display.
   */
  filterFormControl: FormControl;

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatPaginator, {static: true}) public paginator: MatPaginator;

  /**
   * Creates an instance of your component.
   * 
   * @param clipboard Used to copy content of cache item to clipboard
   * @param cacheService Needed to read, remove and clear cache
   * @param backendService Needed to figure out if user has access to specific actions related to the cache or not
   * @param feedbackService Needed to display feedback information to user
   */
  constructor(
    private clipboard: Clipboard,
    private cacheService: CacheService,
    public backendService: BackendService,
    private feedbackService: FeedbackService) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.paginator.pageIndex = 0;
        this.getItems();
      });

    this.getItems();
  }

  /**
   * Retrieves items from backend and databinds table.
   */
  getItems() {
    this.filter.filter = this.filterFormControl.value;
    this.filter.offset = this.paginator.pageIndex * this.paginator.pageSize;
    this.filter.limit = this.paginator.pageSize;
    this.cacheService.list(this.filter).subscribe({
      next: (items: CacheItem[]) => {
      this.cacheItems = items || [];
      this.cacheService.count(this.filter.filter).subscribe({
        next: (count: Count) => this.count = count.count,
        error: (error: any) => this.feedbackService.showError(error)});
    },
    error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Invoked when cache items are paged.
   */
  paged() {
    this.getItems();
  }

  /**
   * Invoked when user wants to clear current filter condition.
   */
  clearFilter() {
    this.filterFormControl.setValue('');
  }

  /**
   * Invoked when user wants to copy value of cache entry.
   * 
   * @param value Value to copy
   */
  copyContent(value: string) {
    this.clipboard.copy(value);
    this.feedbackService.showInfoShort('Value was copied to your clipboard');
  }

  /**
   * Deletes the specified cache item.
   * 
   * @param id ID or key of item to delete
   */
  delete(event: any, id: string) {
    event.stopPropagation();
    this.cacheService.delete(id).subscribe({
      next: () => {
        this.feedbackService.showInfoShort('Cache item deleted');
        this.getItems();
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Purges cache completely, deleting all items from cache.
   */
  deleteAll() {
    this.feedbackService.confirm(
      'Please confirm action',
      `Are you sure you want to purge your cache? Purging your cache will delete ${this.count} items.`,
      () => {
        this.cacheService.clear(this.filterFormControl.value).subscribe({
          next: () => {
            this.feedbackService.showInfoShort('Cache successfully purged');
            this.filterFormControl.setValue('');
          },
          error: (error: any) => this.feedbackService.showError(error)});
    });
  }
}
