
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { ActivatedRoute, Params } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
  private displayDetails: string[] = [];

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
  public getItems(append: boolean = false) {

    // Retrieves log items from the backend.
    let from: string = null;
    if (append && this.items.length > 0) {
      from = this.items[this.items.length - 1].id;
    }
    this.logService.list(
      this.filterFormControl.value,
      from,
      20).subscribe(logitems => {

      if (append) {
        this.items = this.items.concat(logitems || []);
      } else {
        this.items = logitems || [];
      }

      // Counting items with the same filter as we used to retrieve items with.
      if (from === null) {
        this.logService.count(this.filterFormControl.value).subscribe(count => {

          // Assigning count to returned value from server.
          this.count = count.count;

        }, (error: any) => this.feedbackService.showError(error));
      }
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when filter is programmatically changed for some reasons
   * 
   * @param filter Query filter to use for displaying items
   */
  public setFilter(filter: string) {

    // Updating page index, and taking advantage of debounce logic on form control to retrieve items from backend.
    this.filterFormControl.setValue(filter);
  }

  /**
   * Clears the current filter.
   */
  public clearFilter() {

    // Updating page index, and taking advantage of debounce logic on form control to retrieve items from backend.
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

  /**
   * Invoked when user needs more data.
   */
  public feedMore() {
    this.getItems(true);
  }
}
