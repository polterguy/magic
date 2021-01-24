
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

// Application specific imports.
import { Message } from 'src/app/models/message.model';
import { Response } from 'src/app/models/response.model';
import { MessageService } from 'src/app/services/message.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { LogService } from 'src/app/components/log/services/log.service';
import { PublicKey } from 'src/app/components/crypto/models/public-key.model';
import { CryptoService } from 'src/app/components/crypto/services/crypto.service';
import { Model } from '../../codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';
import { ImportPublicKeyDialogComponent } from './import-public-key-dialog/import-public-key-dialog.component';

// CodeMirror options.
import hyperlambda from '../../codemirror/options/hyperlambda.json';

/*
 * Helper class to encapsulate a key and its CodeMirror vocabulary options.
 */
class PublicKeyEx {

  /**
   * Helper field to combine subject and email into one field.
   */
  identity: string;

  /*
   * Public key as returned from server.
   */
  key: PublicKey;

  /*
   * Original key content. Stored in case user updates a key, such that we can log the old key's content.
   */
  original_content: string;

  /*
   * CodeMirror options for editing vocabulary.
   */
  options: Model;
}

/**
 * Component to show public keys installation contains.
 */
@Component({
  selector: 'app-public-keys',
  templateUrl: './public-keys.component.html',
  styleUrls: ['./public-keys.component.scss']
})
export class PublicKeysComponent implements OnInit, OnDestroy {

  /**
   * Subscription for messages published by other components.
   */
  private _subscription: Subscription;

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
    'identity',
    'imported',
    'invocations',
    'delete',
  ];

  /**
   * Creates and instance of your component.
   * 
   * @param dialog Needed to create modal dialogs when importing public keys
   * @param logService Needed to log changes done to key collection
   * @param cryptoService Needed to retrieve public keys from backend
   * @param messageService Needed to transmit relevant messages to other component as state changes
   * @param feedbackService Needed to be able to display feedback to user
   */
  constructor(
    private dialog: MatDialog,
    private logService: LogService,
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
        this.getKeys();
      });

    // Retrieving initial keys to databind table towards.
    this.getKeys();

    // Subscribing to the active tabe changed from parent component.
    this._subscription = this.messageService.subscriber().subscribe((msg: Message) => {
      if (msg.name === 'crypto.active-tab-changed' && msg.content === 0) {

        // Checking if we have a filter, and if so, resetting it.
        if (this.filterFormControl.value !== '') {
          this.filterFormControl.setValue(''); // This will re-retrieve keys from backend.
        }
      }
    });
  }

  /**
   * Implementation of OnDestroy.
   */
  public ngOnDestroy() {

    // House cleaning.
    this._subscription.unsubscribe();
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

      // Resetting list of items we're currently viewing details for.
      this.displayDetails = [];

      // Mapping public keys to expected model.
      this.publicKeys = (keys || []).map(x => {
        const result = {
          identity: x.subject + ' - ' + x.email,
          key: x,
          options: {
            hyperlambda: x.vocabulary,
            options: hyperlambda,
          },
          original_content: x.content,
        };
        result.options.options.autofocus = false;
        return result;
      });

      // Counting items with the same filter as we used to retrieve items with.
      this.cryptoService.countPublicKeys({ filter: this.filterFormControl.value }).subscribe(res => {

        // Assigning count to returned value from server.
        this.count = res.count;

        /*
         * Checking if filter yielded a single key, at which point we transmit message
         * to make sure invocations component filters only on invocations belonging to
         * the specific key.
         */
        let id = -1;
        if (this.count === 1) {
          id = this.publicKeys[0].key.id;
        } else if (this.count === 0) {
          id = 0;
        }
        this.messageService.sendMessage({
          name: 'crypto.key-filter-changed',
          content: {
            id,
            identity: id > 0 ? this.publicKeys[0].identity : null,
          },
        });

      }, (error: any) => this.feedbackService.showError(error));
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Returns true if specified key should be displayed details for.
   * 
   * @param key Key to check if we should display details for
   */
  public shouldDisplayDetails(key: PublicKey) {

    // Returns true if we're currently displaying this particular item.
    return this.displayDetails.filter(x => x === key.id).length > 0;
  }

  /**
   * Invoked when detailed view is toggled for specified key.
   * 
   * @param key Key to toggle detailed view for
   */
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

          // Providing feedback to caller, and reloading keys from backend.
          this.feedbackService.showInfoShort('Public key successfully deleted');
          this.getKeys();
        });
    });
  }

  /**
   * Invoked when user wants to see invocations for the specified key.
   * 
   * @param key Key to view invocations for
   */
  public invocations(key: PublicKeyEx) {

    // Changing filter textbox' content to key's email address, which will retrieve keys again.
    this.filterFormControl.setValue(key.key.email);

    // Changing active tab in tab view.
    this.messageService.sendMessage({
      name: 'crypto.view-invocations',
    })
  }

  /**
   * Changes the enabled state of the specified key.
   * 
   * @param key What key to modify
   */
  public enabledChanged(key: PublicKey) {

    // Invoking backend to change enabled state of key.
    this.cryptoService.setEnabled(key.id, key.enabled).subscribe(() => {

      // Providing feedback to user.
      this.feedbackService.showInfoShort(`Key was successfully ${key.enabled ? 'enabled' : 'disabled'}`);
    });
  }

  /**
   * Invoked when user wants to save a public key.
   * 
   * @param key Key user wants to save
   */
  public save(key: PublicKeyEx) {

    // Updating Hyperlambda from CodeMirror options.
    key.key.vocabulary = key.options.hyperlambda;

    // Invoking backend to retrieve new fingerprint for key.
    this.cryptoService.getFingerprint(key.key.content).subscribe((response: Response) => {

      // Checking if fingerprint was updated, implying the key itself was updated.
      const fingerprintUpdated = key.key.fingerprint !== response.result;

      // Updating key's fingerprint, storing the old fingerprint for reference purposes such that we can log it.
      const oldFingerprint = key.key.fingerprint;
      key.key.fingerprint = response.result;

      // Checking if fingerprint was updated, at which point we warn user that historic invocations will be impossible to verify.
      if (fingerprintUpdated) {

        // Asking user to confirm operation.
        this.feedbackService.confirm(
          'Warning!',
          'Changing the actual key content will make it impossible to easily verify historic cryptographic invocations. Are you sure you wish to proceed?',
          () => {

            // Making sure we create a log item, logging the key's old content and fingerprint.
            let oldKey = '';
            for (var idx of key.original_content) {
              if (oldKey.length % 80 === 0 && oldKey.length !== 0) {
                oldKey += '\r\n';
              }
              oldKey += idx;
            }
            this.logService.createLogEntry(
              'info',
              `.type:crypto.key_changed\r\n   new_fingerprint:${response.result}\r\n   old_fingerprint:${oldFingerprint}\r\n   old_key:@"${oldKey}"`).subscribe(() => {

              // Invoking method responsible for saving the key.
              this.saveKeyImplementation(key, 'The old key was backed up in your log.');
            });
          });
      } else {

        // Invoking method responsible for saving the key.
        this.saveKeyImplementation(key);
      }

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user wants to import a public key.
   */
  public import() {

    // Showing modal dialog.
    const dialogRef = this.dialog.open(ImportPublicKeyDialogComponent, {
      width: '50%',
    });

    // Subscribing to closed event to provide user with some feedback, if a key is imported.
    dialogRef.afterClosed().subscribe((key: PublicKey) => {

      // Checking if modal dialog imported a key.
      if (key) {

        // Key was imported, displaying key for editing.
        this.filterFormControl.setValue(key.fingerprint);
        this.feedbackService.showInfo('Key successfully imported, please edit its vocabulary and enable it');
      }
    });
  }

  /*
   * Private helper methods.
   */

  /*
   * Saves the specified key, and evicts key from server's cache.
   */
  private saveKeyImplementation(key: PublicKeyEx, extraInfo?: string) {

    // Invoking backend to save key.
    this.cryptoService.savePublicKey(key.key).subscribe(() => {

      // Providing some feedback to user, and retrieving keys again to update grid.
      let info = 'Key was successfully saved';
      if (extraInfo) {
        info += '. ' + extraInfo;
      }
      if (extraInfo) {
        this.feedbackService.showInfo(info);
      } else {
        this.feedbackService.showInfoShort(info);
      }
      key.identity = key.key.subject + ' - ' + key.key.email;

      // Making sure we evict cache for public key.
      this.cryptoService.evictCacheForPublicKey(key.key).subscribe(() => {

        // Some simple logging.
        console.info('Key evicted from cache');

      }, (error: any) => this.feedbackService.showError(error));

    }, (error: any) => this.feedbackService.showError(error));
  }
}
