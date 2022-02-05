
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
// Application specific imports.
import { FeedbackService } from '../../../services/feedback.service';
import { LogItem } from 'src/app/components/diagnostics/diagnostics-log/models/log-item.model';
import { LogService } from 'src/app/components/diagnostics/diagnostics-log/services/log.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

/**
 * Log component for reading backend's log.
 */
@Component({
  selector: 'app-diagnostics-log',
  templateUrl: './diagnostics-log.component.html',
  styleUrls: ['./diagnostics-log.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('0.75s cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})
export class LogComponent implements OnInit {

  // List of log item IDs that we're currently viewing details for.
  private displayDetails: string[] = [];

  /**
   * Columns to display in table.
   */
  public displayedColumns: string[] = ['content', 'type', 'when'];

  /**
   * Currently viewed log items.
   */
  public items: LogItem[] = [];
  public expandedElement: LogItem | null;
  /**
   * Number of log items in the backend matching the currently applied filter.
   */
  public count: number = 0;

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
    private clipboard: Clipboard) { }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {
    // Retrieving initial items.
    this.getItems();

    // Counting items.
    this.logService.count(null).subscribe(count => {

      // Assigning count to value returned from server.
      this.count = count.count;

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Returns log items from your backend.
   */
  public getItems() {

    // Retrieves log items from the backend.
    let from: string = null;
    if (this.items.length > 0) {
      from = this.items[this.items.length - 1].id;
    }
    this.logService.list(
      from,
      20).subscribe(logitems => {

      this.items = this.items.concat(logitems || []);

    }, (error: any) => this.feedbackService.showError(error));
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
   * Returns specified object as an array to caller.
   * 
   * @param meta Meta object to return array for
   */
  public toArray(meta: object) {
    const result = [];
    var names = Object.getOwnPropertyNames(meta);
    for (const idx of names) {
      result.push({
        key: idx,
        value: meta[idx],
      });
    }
    return result;
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
    this.getItems();
  }

  /**
   * 
   * @param e - scrolling event
   */
  onTableScroll(e: any) {
    const clientHeight = e.target.clientHeight // viewport
    const tableScrollHeight = e.target.scrollHeight // length of all table
    const scrollLocation = e.target.scrollTop; // how far user scrolled

    // If the user has scrolled within 500px of the bottom, add more data
    const limit = tableScrollHeight - scrollLocation === clientHeight;   
    if (limit && (this.items.length < this.count)) {
      this.getItems();
    }
  }
}
