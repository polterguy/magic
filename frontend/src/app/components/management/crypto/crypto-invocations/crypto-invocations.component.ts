
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

// Application specific imports.
import { Message } from 'src/app/models/message.model';
import { PublicKey } from '../models/public-key.model';
import { MessageService } from 'src/app/services--/message.service';
import { FeedbackService } from 'src/app/services--/feedback.service';
import { CryptoService } from 'src/app/components/management/crypto/services/crypto.service';
import { CryptoInvocation } from 'src/app/components/management/crypto/models/crypto-invocations.model';

/**
 * Displays all cryptographically signed invocations towards server.
 */
@Component({
  selector: 'app-crypto-invocations',
  templateUrl: './crypto-invocations.component.html',
  styleUrls: ['./crypto-invocations.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('0.75s cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})
export class CryptoInvocationsComponent implements OnInit, OnDestroy {

  // Subscription for messages published by other components.
  private subscription: Subscription;

  /**
   * Filter form control for filtering items to display.
   */
  filterFormControl: FormControl;

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  /**
   * Cryptographically signed invocations as returned from backend.
   */
  invocations: CryptoInvocation[] = [];

  /**
   * Currently expanded item.
   */
  expandedElement: CryptoInvocation | null;

  /**
   * Number of items in the backend matching the currently applied filter.
   */
  count: number = 0;

  /**
   * Columns to display in table showing public keys.
   */
  displayedColumns: string[] = [
    'request_id',
    'created',
  ];

  /**
   * Information about specific keys.
   */
  keys: PublicKey[] = [];

  /**
   * Creates an instance of your component.
   *
   * @param clipboard Needed to be able to copy information to the clipboard
   * @param cryptoService Needed to retrieve cryptographically signed invocations from backend
   * @param messageService Needed to be able to subscribe to messages of relevance transmitted by other components
   * @param feedbackService Needed to display information to user
   */
  constructor(
    private clipboard: Clipboard,
    private cryptoService: CryptoService,
    private messageService: MessageService,
    private feedbackService: FeedbackService) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {
      if (msg.name === 'crypto.receipts.key-id') {
        this.filterFormControl.setValue('key:' + msg.content);
      }
    });

    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: any) => {
        this.filterFormControl.setValue(query);
        this.paginator.pageIndex = 0;
        this.getInvocations();
      });
      setTimeout(() => {
        if(this.filterFormControl.value === '') {
          // Retrieving invocations unfiltered.
          this.getInvocations();
        }
      }, 100);
  }

  /**
   * Implementation of OnInit.
   */
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /**
   * Retrieves invocations from backend.
   */
  getInvocations() {
    const filterValue = <string>this.filterFormControl.value;
    const filter: any = { };
    if (filterValue.indexOf('key:') === 0) {
      filter.crypto_key = filterValue.substring(filterValue.indexOf(':') + 1);
    } else {
      filter.filter = filterValue;
    }
    this.cryptoService.invocations({
      filter,
      offset: this.paginator.pageIndex * this.paginator.pageSize,
      limit: this.paginator.pageSize
    }).subscribe({
      next: (invocations: CryptoInvocation[]) => {
        this.invocations = invocations || [];
        const countFilter: any = { };
        if (filterValue.indexOf('key:') === 0) {
          countFilter.crypto_key = filterValue.substring(filterValue.indexOf(':') + 1);
        } else {
          countFilter.filter = filterValue;
        }
        this.cryptoService.countInvocations({ filter: countFilter }).subscribe({
          next: (res) => this.count = res.count,
          error: (error: any) => this.feedbackService.showError(error)});
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Invoked when detailed view is toggled for specified invocation.
   *
   * @param invocation Inovcation to toggle detailed view for
   */
  getDetails(invocation: CryptoInvocation) {
    if (this.keys.filter(x => x.id === invocation.crypto_key).length === 0) {
      this.cryptoService.publicKeys({
        key_id: invocation.crypto_key
      }).subscribe({
        next: (result: PublicKey[]) => this.keys.push(result[0]),
        error: (error: any) => this.feedbackService.showError(error)});
    }
  }

  /**
   * Copies the specified content into the clipboard.
   *
   * @param content Content to copy to clipboard
   */
  copyToClipboard(content: string) {
    this.clipboard.copy(content);
    this.feedbackService.showInfoShort('Content was copied to your clipboard');
  }

  /**
   * Invoked when paginator wants to page data table.
   *
   * @param e Page event argument
   */
  paged(e: PageEvent) {
    this.paginator.pageSize = e.pageSize;
    this.getInvocations();
  }

  /**
   * Clears the current filter.
   */
  clearFilter() {
    this.paginator.pageIndex = 0;
    this.filterFormControl.setValue('');
  }

  /**
   * Invoked when information about a specific key is needed.
   *
   * @param id ID of key to retrieve
   */
  getCryptoKeySubject(id: number) {
    const result = this.keys.filter(x => x.id === id);
    if (result.length > 0) {
      return result[0].subject + ' - ' + result[0].email;
    }
    return '';
  }

  /**
   * Invoked when information about a specific key is needed.
   *
   * @param id ID of key to retrieve
   */
   getCryptoKeyFingerprint(id: number) {
    const result = this.keys.filter(x => x.id === id);
    if (result.length > 0) {
      return result[0].fingerprint;
    }
    return '';
  }
}
