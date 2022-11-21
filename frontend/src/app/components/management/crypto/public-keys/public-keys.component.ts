
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

// Application specific imports.
import { Message } from 'src/app/models/message.model';
import { Response } from 'src/app/models/response.model';
import { MessageService } from 'src/app/services--/message.service';
import { BackendService } from 'src/app/services--/backend.service--';
import { FeedbackService } from 'src/app/services--/feedback.service';
import { PublicKey } from 'src/app/components/management/crypto/models/public-key.model';
import { CryptoService } from 'src/app/components/management/crypto/services/crypto.service';
import { Model } from '../../../utilities/codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';
import { ImportPublicKeyDialogComponent } from './import-public-key-dialog/import-public-key-dialog.component';

// CodeMirror options.
import hyperlambda from '../../../utilities/codemirror/options/hyperlambda.json';

/*
 * Helper class to encapsulate all public keys and their CodeMirror vocabulary options.
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
 * Component to show public keys.
 */
@Component({
  selector: 'app-public-keys',
  templateUrl: './public-keys.component.html',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('0.75s cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})
export class PublicKeysComponent implements OnInit, OnDestroy {

  // Needed to subscribe to messages published by other components.
  private subscription: Subscription;

  /**
   * Filter form control for filtering log items to display.
   */
  filterFormControl: FormControl;

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  /**
   * Public keys the table is currently databound towards.
   */
  publicKeys: PublicKeyEx[] = [];

  /**
   * Currently displayed public key.
   */
  expandedElement: PublicKeyEx | null;

  /**
   * Number of log items in the backend matching the currently applied filter.
   */
  count: number = 0;

  /**
   * Columns to display in table showing public keys.
   */
  displayedColumns: string[] = [
    'identity',
    'imported',
    'delete',
  ];

  /**
   * Creates and instance of your component.
   *
   * @param dialog Needed to create modal dialogs when importing public keys
   * @param clipboard Needed to be able to copy things into clipboard
   * @param cryptoService Needed to retrieve public keys from backend
   * @param backendService Needed to determine access rights of user in backend
   * @param messageService Needed to subscribe to relevant messages, such that server key pair has been created, etc
   * @param feedbackService Needed to be able to display feedback to user
   */
  constructor(
    private dialog: MatDialog,
    private clipboard: Clipboard,
    private cryptoService: CryptoService,
    public backendService: BackendService,
    private messageService: MessageService,
    private feedbackService: FeedbackService) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {
      if (msg.name === 'crypto.server.new-key-pair-generated') {
        this.getKeys();
      }
    });

    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: any) => {
        this.filterFormControl.setValue(query);
        this.paginator.pageIndex = 0;
        this.getKeys();
      });

    this.getKeys();
  }

  /**
   * Implementation of OnDestroy.
   */
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /**
   * Invoked when detailed view is toggled for specified key.
   *
   * @param key Key to toggle detailed view for
   */
  getUserAssociation(key: PublicKey) {
    if (!key.username) {
      this.cryptoService.getUserAssociation(key.id).subscribe({
        next: (result: Response) => key.username = result.result,
        error: (error: any) => this.feedbackService.showError(error)});
    }
  }

  /**
   * Invoked when paginator wants to page data table.
   *
   * @param e Page event argument
   */
  paged(e: PageEvent) {
    this.paginator.pageSize = e.pageSize;
    this.getKeys();
  }

  /**
   * Clears the current filter.
   */
  clearFilter() {
    this.paginator.pageIndex = 0;
    this.filterFormControl.setValue('');
  }

  /**
   * Deletes a public cryptography key from your backend.
   *
   * @param event Click event, needed to stop propagation
   * @param key Public key to delete
   */
  delete(event: any, key: PublicKey) {
    event.stopPropagation();
    this.feedbackService.confirm(
      'Please confirm delete operation',
      `Are you sure you want to delete the public key belonging to ${key.subject} - ${key.email}`,
      () => {
        this.cryptoService.deletePublicKey(key.id).subscribe({
          next: () => {
            this.feedbackService.showInfoShort('Public key successfully deleted');
            this.getKeys();
          },
          error:(error: any) => this.feedbackService.showError(error)});
    });
  }

  /**
   * Invoked when user wants to copy a key's fingerprint
   *
   * @param content Fingerprint to put on to clipboard
   */
  copyContentToClipboard(content: string) {
    this.clipboard.copy(content);
    this.feedbackService.showInfoShort('Copied to your clipboard!');
  }

  /**
   * Changes the enabled state of the specified key.
   *
   * @param key What key to modify
   */
  enabledChanged(key: PublicKey) {
    this.cryptoService.setEnabled(key.id, key.enabled).subscribe({
      next: () => this.feedbackService.showInfoShort(`Key was successfully ${key.enabled ? 'enabled' : 'disabled'}`),
      error: (error: any) =>this.feedbackService.showError(error)});
  }

  /**
   * Invoked when user wants to save a public key.
   *
   * @param key Key user wants to save
   */
  save(key: PublicKeyEx) {
    key.key.vocabulary = key.options.hyperlambda;
    this.cryptoService.getFingerprint(key.key.content).subscribe({
      next: (response: Response) => {
        const fingerprintUpdated = key.key.fingerprint !== response.result;
        key.key.fingerprint = response.result;
        if (fingerprintUpdated) {
          this.feedbackService.confirm(
            'Warning!',
            'Changing the actual key content will make it impossible to easily verify historic cryptographic invocations. Are you sure you wish to proceed?',
            () => {
              let oldKey = '';
              for (var idx of key.original_content) {
                if (oldKey.length % 80 === 0 && oldKey.length !== 0) {
                  oldKey += '\r\n';
                }
                oldKey += idx;
              }
            });
        } else {
          this.saveKeyImplementation(key);
        }
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Invoked when user wants to import a public key.
   */
  import() {
    const dialogRef = this.dialog.open(ImportPublicKeyDialogComponent, {
      width: '500px',
    });
    dialogRef.afterClosed().subscribe((key: PublicKey) => {
      if (key) {
        this.filterFormControl.setValue(key.fingerprint);
        this.feedbackService.showInfo('Key successfully imported, please edit its vocabulary and enable it');
      }
    });
  }

  /**
   * Invoked when user wants to see all receipts belonging to one specific key.
   *
   * @param key Key to show receipts for
   */
  showReceipts(key: PublicKey) {
    this.messageService.sendMessage({
      name: 'crypto.receipts.show',
      content: key.id
    });
  }

  /*
   * Private helper methods.
   */

  /*
   * Saves the specified key, and evicts key from server's cache.
   */
  private saveKeyImplementation(key: PublicKeyEx, extraInfo?: string) {
    this.cryptoService.updatePublicKey(key.key).subscribe({
      next: () => {
        let info = 'Key was successfully saved';
        if (extraInfo) {
          info += '. ' + extraInfo;
        }
        key.identity = key.key.subject + '  <' + key.key.email + '>';
        if (key.key.username && key.key.username !== '') {
          this.cryptoService.associateWithUser(key.key.id, key.key.username).subscribe({
            next: () => {
              if (extraInfo) {
                this.feedbackService.showInfo(info);
              } else {
                this.feedbackService.showInfoShort(info);
              }

            },
            error: (error: any) => this.feedbackService.showError(error)});
        } else {
          this.cryptoService.deleteUserAssociation(key.key.id).subscribe({
            next: () => {
              if (extraInfo) {
                this.feedbackService.showInfo(info);
              } else {
                this.feedbackService.showInfoShort(info);
              }
            },
            error:(error: any) => this.feedbackService.showError(error)});
        }
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /*
   * Returns public keys from backend.
   */
  private getKeys() {
    this.cryptoService.publicKeys({
      filter: this.filterFormControl.value,
      offset: this.paginator.pageIndex * this.paginator.pageSize,
      limit: this.paginator.pageSize
    }).subscribe({
      next: (keys: PublicKey[]) => {
        this.publicKeys = (keys || []).map(x => {
          const result = {
            identity: x.subject + ' <' + x.email + '>',
            key: x,
            options: {
              hyperlambda: x.vocabulary,
              options: hyperlambda,
            },
            original_content: x.content,
          };
          result.options.options.autofocus = false;

          setTimeout(() => {
            if (document.querySelector('.CodeMirror')) {
              var domNode = (<any>document.querySelector('.CodeMirror'));
              var editor = domNode.CodeMirror;
              editor.doc.markClean();
              editor.doc.clearHistory(); // To avoid having initial loading of file becoming an "undo operation".
            }
          }, 500);
          return result;
        });

        this.cryptoService.countPublicKeys({ filter: this.filterFormControl.value }).subscribe({
          next: (res) => this.count = res.count,
          error: (error: any) => this.feedbackService.showError(error)});
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }
}
