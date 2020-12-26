
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { Component, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { PublicKey } from 'src/app/models/public-key.model';
import { CryptoService } from 'src/app/services/crypto.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { PublicKeyFull } from 'src/app/models/public-key-full.model';
import { Model } from '../codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';

// CodeMirror options.
import hyperlambda from '../codemirror/options/hyperlambda.json';

/*
 * Helper class to encapsulate a key and its CodeMirror vocabulary options.
 */
class PublicKeyEx {

  /*
   * Public key as returned from server.
   */
  key: PublicKey;

  /*
   * CodeMirror options for editing vocabulary.
   */
  options: Model;
}

/**
 * Crypto component allowing you to administrate your server's cryptography keys.
 */
@Component({
  selector: 'app-crypto',
  templateUrl: './crypto.component.html',
  styleUrls: ['./crypto.component.scss']
})
export class CryptoComponent implements OnInit {

  // List of log item IDs that we're currently viewing details for.
  private displayDetails: number[] = [];

  /**
   * Filter form control for filtering log items to display.
   */
  public filterFormControl: FormControl;

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatPaginator, {static: true}) public paginator: MatPaginator;

  /**
   * Public keys the table is currently databound towards.
   */
  public publicKeys: PublicKeyEx[] = [];

  /**
   * Number of log items in the backend matching the currently applied filter.
   */
  public count: number = 0;

  /**
   * Columns to display in table showing public keys.
   */
  public displayedColumns: string[] = [
    'subject',
    'email',
    'delete',
  ];

  /**
   * Creates an instance of your component.
   * 
   * @param cryptoService Cryptography service needed to retrieve and update crypto items from your backend
   */
  constructor(
    private cryptoService: CryptoService,
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
        this.getKeys();
      });

    // Retrieving initial keys to databind table towards.
    this.getKeys();
  }

  /**
   * Returns public keys from backend.
   */
  public getKeys() {

    // Retrieving public keys from backend.
    this.cryptoService.publicKeys({
      filter: this.filterFormControl.value,
      offset: this.paginator.pageIndex * this.paginator.pageSize,
      limit: this.paginator.pageSize
    }).subscribe((keys: PublicKey[]) => {

      // Mapping public keys to expected model.
      this.publicKeys = (keys || []).map(x => {
        return {
          key: x,
          options: {
            hyperlambda: x.vocabulary,
            options: hyperlambda,
          }
        }
      });

      // Counting items with the same filter as we used to retrieve items with.
      this.cryptoService.countPublicKeys({ filter: this.filterFormControl.value }).subscribe(res => {

        // Assigning count to returned value from server.
        this.count = res.count;

      }, (error: any) => this.feedbackService.showError(error));
    });
  }

  public shouldDisplayDetails(key: PublicKey) {

    // Returns true if we're currently displaying this particular item.
    return this.displayDetails.filter(x => x === key.id).length > 0;
  }

  public toggleDetails(key: PublicKey) {

    // Checking if we're already displaying details for current item.
    const idx = this.displayDetails.indexOf(key.id);
    if (idx !== -1) {

      // Hiding item.
      this.displayDetails.splice(idx, 1);
    } else {

      // Displaying item.
      this.displayDetails.push(key.id);
    }
  }

  /**
   * Invoked when paginator wants to page data table.
   * 
   * @param e Page event argument
   */
  public paged(e: PageEvent) {

    // Changing pager's size according to arguments, and retrieving log items from backend.
    this.paginator.pageSize = e.pageSize;
    this.getKeys();
  }

  /**
   * Clears the current filter.
   */
  public clearFilter() {

    // Updating page index, and taking advantage of debounce logic on form control to retrieve items from backend.
    this.paginator.pageIndex = 0;
    this.filterFormControl.setValue('');
  }

  /**
   * Deletes a public cryptography key from your backend.
   * 
   * @param event Click event, needed to stop propagation
   * @param key Public key to delete
   */
  public delete(event: any, key: PublicKey) {

    // Making sure the event doesn't propagate upwards, which would trigger the row click event.
    event.stopPropagation();

    // Asking user to confirm deletion of public key.
    this.feedbackService.confirm(
      'Please confirm delete operation',
      `Are you sure you want to delete the public key belonging to ${key.subject} - ${key.email}`,
      () => {

        // Invoking backend to delete public key.
        this.cryptoService.deletePublicKey(key.id).subscribe(() => {
          this.feedbackService.showInfoShort('Public key successfully deleted');
        });
    });
  }

  /**
   * Invoked when the content of a public key changes.
   * 
   * @param key Key that triggered event
   */
  public publicKeyChanged(key: PublicKey) {

    // Invoking backend to retrieve new fingerprint for key.
    this.cryptoService.getFingerprint(key.content).subscribe((response: Response) => {

      // Updating key's fingerprint, and providing user with some feedback.
      this.feedbackService.showInfo('Fingerprint successfully updated to match key. Remember to save your key if you want the changes to take effect.');
      key.fingerprint = response.result;

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user wants to save a public key.
   * 
   * @param key Key user wants to save
   */
  public save(key: PublicKeyEx) {

    // Updating Hyperlambda from CodeMirror options.
    key.key.vocabulary = key.options.hyperlambda;

    // Invoking backend to save key.
    this.cryptoService.savePublicKey(key.key).subscribe(() => {

      // Providing some feedback to user.
      this.feedbackService.showInfoShort('Key was successfully updated');

    }, (error: any) => this.feedbackService.showError(error));
  }
}
