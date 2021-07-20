
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Component, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { BazarApp } from './models/bazar-app.model';
import { BazarService } from './services/bazar.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { ViewAppDialogComponent } from './view-app-dialog/view-app-dialog.component';

/**
 * Bazar component allowing you to obtain additional Micro Service backend
 * modules for your Magic installation.
 */
@Component({
  selector: 'app-bazar',
  templateUrl: './bazar.component.html',
  styleUrls: ['./bazar.component.scss']
})
export class BazarComponent implements OnInit {

  /**
   * Apps as returned from Bazar.
   */
  public apps: BazarApp[] = [];

  /**
   * Number of items matching currently applied filter.
   */
  public count: number = 0;

  /**
   * Filter form control for filtering apps to display.
   */
  public filterFormControl: FormControl;

  /**
   * Paginator for paging apps.
   */
  @ViewChild(MatPaginator, {static: true}) public paginator: MatPaginator;

  /**
   * Creates an instance of your component.
   */
  constructor(
    private dialog: MatDialog,
    private bazarService: BazarService,
    private feedbackService: FeedbackService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

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

    // Retrieving Bazar items from main Bazar.
    this.getItems();
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
   * Invoked when a user clicks a specific app to view details about it.
   * 
   * @param app What app the user clicked
   */
  public viewApp(app: BazarApp) {

    // Opening up modal dialog passing in reference to Bazar app.
    const dialogRef = this.dialog.open(ViewAppDialogComponent, {
      data: app,
    });
  }

  /*
   * Private helper methods.
   */
  private getItems() {

    // Invoking service to retrieve available apps matching criteria.
    this.bazarService.listApps(
      this.filterFormControl.value,
      this.paginator.pageIndex * this.paginator.pageSize,
      this.paginator.pageSize).subscribe((apps: BazarApp[]) => {

      // Assigning result to model.
      this.apps = apps;

      // Retrieving number of items.
      this.bazarService.countApps(this.filterFormControl.value).subscribe((count: Count) => {

        // Assigning model.
        this.count = count.count;
      });

    }, (error: any) => this.feedbackService.showError(error));
  }
}
