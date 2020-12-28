
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// Application specific imports.
import { Message } from 'src/app/models/message.model';
import { CryptoService } from 'src/app/services/crypto.service';
import { MessageService } from 'src/app/services/message.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { CryptoInvocation } from 'src/app/models/crypto-invocations.model';

/**
 * Displays all cryptographically signed invocations towards server.
 */
@Component({
  selector: 'app-crypto-invocations',
  templateUrl: './crypto-invocations.component.html',
  styleUrls: ['./crypto-invocations.component.scss']
})
export class CryptoInvocationsComponent implements OnInit, OnDestroy {

  // List of item IDs that we're currently viewing details for.
  private displayDetails: number[] = [];

  /**
   * Subscription for messages published by other components.
   */
  private _subscription: Subscription;

  /**
   * If this is not -1 it is a filter for a specific crypto_key, which we pass in
   * as we retrieve invocations.
   */
  public keyId: number = -1;

  /**
   * Filter form control for filtering items to display.
   */
  public filterFormControl: FormControl;

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatPaginator, {static: true}) public paginator: MatPaginator;

  /**
   * Cryptographically signed invocations as returned from backend.
   */
  public invocations: CryptoInvocation[] = [];

  /**
   * Number of items in the backend matching the currently applied filter.
   */
  public count: number = 0;

  /**
   * Columns to display in table showing public keys.
   */
  public displayedColumns: string[] = [
    'request_id',
    'created',
  ];

  /**
   * Creates an instance of your component.
   * 
   * @param cryptoService Needed to retrieve cryptographically signed invocations from backend
   * @param feedbackService Needed to display information to user
   */
  constructor(
    private cryptoService: CryptoService,
    private messageService: MessageService,
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
        this.getInvocations();
      });

    // Making sure we subscribe to messages related to component.
    this._subscription = this.messageService.subscriber().subscribe((msg: Message) => {

      // Verifying this is the correct message.
      if (msg.name === 'crypto.key-filter-changed') {

        // Updating filter and retrieving invocations.
        this.keyId = msg.content;
        if (this.keyId === 0) {
          this.invocations = [];
        } else {
          this.getInvocations();
        }
      }
    });
  }

  /**
   * Implementation of OnDestroy
   */
  ngOnDestroy() {

    // Need to unsibscribe to messages published by other components.
    this._subscription.unsubscribe();
  }

  /**
   * Retrieves invocations from backend.
   */
  public getInvocations() {

    // Invoking backend to retrieve invocations.
    this.cryptoService.invocations({
      filter: this.keyId === -1 ? null : this.keyId,
      offset: this.paginator.pageIndex * this.paginator.pageSize,
      limit: this.paginator.pageSize
    }).subscribe((invocations: CryptoInvocation[]) => {

      // Resetting list of items we're currently viewing details for.
      this.displayDetails = [];

      // Assigning model for tabel to returned value from backend.
      this.invocations = invocations || [];

      // Counting items with the same filter as we used to retrieve items with.
      this.cryptoService.countInvocations({ filter: this.filterFormControl.value }).subscribe(res => {

        // Assigning count to returned value from server.
        this.count = res.count;

      }, (error: any) => this.feedbackService.showError(error));
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Returns true if specified key should be displayed details for.
   * 
   * @param invocation Inovcation to check if we should display details for
   */
  public shouldDisplayDetails(invocation: CryptoInvocation) {

    // Returns true if we're currently displaying details of this particular item.
    return this.displayDetails.filter(x => x === invocation.id).length > 0;
  }

  /**
   * Invoked when detailed view is toggled for specified invocation.
   * 
   * @param invocation Inovcation to toggle detailed view for
   */
  public toggleDetails(invocation: CryptoInvocation) {

    // Checking if we're already displaying details for current item.
    const idx = this.displayDetails.indexOf(invocation.id);
    if (idx !== -1) {

      // Hiding item.
      this.displayDetails.splice(idx, 1);
    } else {

      // Displaying item.
      this.displayDetails.push(invocation.id);
    }
  }

  /**
   * Invoked when paginator wants to page data table.
   * 
   * @param e Page event argument
   */
  public paged(e: PageEvent) {

    // Changing pager's size according to arguments, and retrieving invocations from backend.
    this.paginator.pageSize = e.pageSize;
    this.getInvocations();
  }

  /**
   * Clears the current filter.
   */
  public clearFilter() {

    // Updating page index, and taking advantage of debounce logic on form control to retrieve items from backend.
    this.paginator.pageIndex = 0;
    this.filterFormControl.setValue('');
  }
}
