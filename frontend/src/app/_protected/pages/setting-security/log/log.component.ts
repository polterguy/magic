import { Component, OnInit } from '@angular/core';
import { GeneralService } from 'src/app/_general/services/general.service';
import { LogService } from './_services/log.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { LogItem } from './_models/log-item.model';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { LogExceptionComponent } from './components/log-exception/log-exception.component';

@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.scss']
})
export class LogComponent implements OnInit {

  private retrievingItems = false;

  /**
   * Columns to display in table.
   */
  displayedColumns: string[] = ['id', 'date','content', 'type', 'meta', 'description'];

  /**
   * Currently viewed log items.
   */
  items: any = [];
  expandedElement: LogItem | null;

  /**
   * Number of log items in the backend matching the currently applied filter.
   */
  count: number = 0;

  public isLoading: boolean = true;

  public pageSize: number = 15;
  public currentPage: number = 0;

  public dataSource: any = [];

  /**
   * Creates an instance of your component.
   *
   * @param generalService Needed to display feedback to user
   * @param logService Log HTTP service to use for retrieving log items
   * @param clipboard Needed to be able to access the clipboard
   */
  constructor(
    private dialog: MatDialog,
    private generalService: GeneralService,
    private logService: LogService,
    private clipboard: Clipboard) { }

  /**
   * OnInit implementation.
   */
  ngOnInit() {
    this.getItems();
    this.getCount();
  }

  /**
   * Returns log items from your backend.
   */
  getItems() {
    let from: string = null;
    if (this.currentPage > 0) {
      from = this.items[this.currentPage-1][this.pageSize - 1].id;
    }
    this.logService.list(from, this.pageSize).subscribe({
      next: (logitems) => {
        // this.items = this.items.concat(logitems || []);
        this.items.push(logitems || []);
        this.retrievingItems = false;
        this.getDataSource();
        this.isLoading = false;
      },
      error: (error: any) => {
        this.retrievingItems = false;
        this.generalService.showFeedback(error.error.message??error, 'errorMessage');
      }});
  }

  getCount() {
    this.logService.count(null).subscribe({
      next: (count) => {
        this.count = count.count;
      },
      error: (error: any) => this.generalService.showFeedback(error.error.message??error, 'errorMessage')});
  }

  page(event: PageEvent) {
    console.log(event)
    this.currentPage = event.pageIndex;
    if (!this.items[this.currentPage]) {
      this.getItems();
    } else {
      this.getDataSource();
    }
  }

  getDataSource() {
    this.dataSource = this.items[this.currentPage];
  }

  viewException(item: any) {
    this.dialog.open(LogExceptionComponent, {
      width: '700px',
      data: item
    })
  }

  /**
   * Returns specified object as an array to caller.
   *
   * @param meta Meta object to return array for
   */
  // toArray(meta: object) {
  //   const result = [];
  //   var names = Object.getOwnPropertyNames(meta);
  //   for (const idx of names) {
  //     result.push({
  //       key: idx,
  //       value: meta[idx],
  //     });
  //   }
  //   return result;
  // }

  /**
   * Puts the specified content into the user's clipboard
   *
   * @param content Content to put on to clipboard
   */
  copyContent(content: string) {
    this.clipboard.copy(content);
    this.generalService.showFeedback('Contentis copied on your clipboard');
  }

  /**
   * Invoked when element wrapping table is scrolled.
   *
   * @param e - scrolling event
   */
  // onTableScroll(e: any) {
  //   if (this.retrievingItems) {
  //     return;
  //   }
  //   const clientHeight = e.target.clientHeight;
  //   const tableScrollHeight = e.target.scrollHeight;
  //   const scrollLocation = e.target.scrollTop;
  //   const limit = clientHeight + scrollLocation > tableScrollHeight - 50;
  //   if (limit && (this.items.length < this.count)) {
  //     this.retrievingItems = true;
  //     this.getItems();
  //   }
  // }


  public filterList(event: string) {
    if (event !== '') {
      // this.dataSource = this.originalDataSource.filter((item: any) => item.name.indexOf(event) > -1);
    } else {
      // this.dataSource = this.originalDataSource;
    }
  }
}
