
import { Component, OnInit } from '@angular/core';
import { LogService } from 'src/app/services/log-service';
import { LogItem } from 'src/app/models/log-item';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { ViewLogDetails } from './modals/view-log-details';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit {

  public offset = 0;
  public limit = 10;
  public items: LogItem[] = null;
  public count: number;
  public noErrors = 0;
  public displayedColumns: string[] = ['when', 'type', 'content', 'details'];
  public filter: string = null;
  public filterFormControl: FormControl;
  public live: boolean;

  constructor(
    private logService: LogService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.filterFormControl = new FormControl('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: any) => {
        this.filter = query;
        this.offset = 0;
        this.getItems();
      });
    this.getItems();
  }

  pollClicked(e: MatSlideToggleChange) {
    this.live = e.checked;
    this.poll();
  }

  poll() {
    if (this.live) {
      this.getItems();
      setTimeout(() => {
        this.poll();
      }, 5000);
    }
  }

  getItems() {
    this.logService.listLogItems(
      this.filter,
      this.offset,
      this.limit).subscribe(res => {
      this.items = res;
    }, error => {
      this.showHttpError(error);
    });
    this.logService.countLogItems().subscribe(res => {
      this.count = res.result;
    }, error => {
      this.showHttpError(error);
    });
    this.logService.countErrorItems().subscribe(res => {
      this.noErrors = res.result;
    }, error => {
      this.showHttpError(error);
    });
  }

  paged(e: PageEvent) {
    this.offset = e.pageSize * e.pageIndex;
    this.getItems();
  }

  showDetails(item: LogItem) {
    this.dialog.open(ViewLogDetails, {
      width: '80%',
      data: item
    });
  }

  deleteAll() {
    this.logService.deleteAll().subscribe(res => {
      this.getItems();
    }, error => {
      this.showHttpError(error);
    });
  }

  showHttpError(error: any) {
    this.snackBar.open(error.error ? error.error.message : error, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }
}
