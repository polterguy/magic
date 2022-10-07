
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';

// Application specific imports.
import { LogService } from '../../../_protected/pages/log/_services/log.service';
import { LogItem } from 'src/app/models/log-item.model';
import { FeedbackService } from '../../../services/feedback.service';

/**
 * Log component for reading backend's log.
 */
@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('0.75s cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})
export class LogComponent implements OnInit {

  private retrievingItems = false;

  /**
   * Columns to display in table.
   */
  displayedColumns: string[] = ['content', 'type', 'when'];

  /**
   * Currently viewed log items.
   */
  items: LogItem[] = [];
  expandedElement: LogItem | null;

  /**
   * Number of log items in the backend matching the currently applied filter.
   */
  count: number = 0;

  /**
   * Creates an instance of your component.
   *
   * @param feedbackService Needed to display feedback to user
   * @param logService Log HTTP service to use for retrieving log items
   * @param clipboard Needed to be able to access the clipboard
   */
  constructor(
    private feedbackService: FeedbackService,
    private logService: LogService,
    private clipboard: Clipboard) { }

  /**
   * OnInit implementation.
   */
  ngOnInit() {
    this.getItems();
    this.logService.count(null).subscribe({
      next: (count) => this.count = count.count,
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Returns log items from your backend.
   */
  getItems() {
    let from: string = null;
    if (this.items.length > 0) {
      from = this.items[this.items.length - 1].id;
    }
    this.logService.list(from, this.items.length > 0 ? 20 : 50).subscribe({
      next: (logitems) => {
        this.items = this.items.concat(logitems || []);
        this.retrievingItems = false;
      },
      error: (error: any) => {
        this.retrievingItems = false;
        this.feedbackService.showError(error);
      }});
  }

  /**
   * Returns specified object as an array to caller.
   *
   * @param meta Meta object to return array for
   */
  toArray(meta: object) {
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
  copyContent(content: string) {
    this.clipboard.copy(content);
    this.feedbackService.showInfoShort('The specified content can be found on your clipboard');
  }

  /**
   * Invoked when element wrapping table is scrolled.
   *
   * @param e - scrolling event
   */
  onTableScroll(e: any) {
    if (this.retrievingItems) {
      return;
    }
    const clientHeight = e.target.clientHeight;
    const tableScrollHeight = e.target.scrollHeight;
    const scrollLocation = e.target.scrollTop;
    const limit = clientHeight + scrollLocation > tableScrollHeight - 50;
    if (limit && (this.items.length < this.count)) {
      this.retrievingItems = true;
      this.getItems();
    }
  }
}
