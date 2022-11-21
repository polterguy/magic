
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { MatTabGroup } from '@angular/material/tabs';
import { Component, ViewChild } from '@angular/core';

// Application specific imports.
import { Message } from 'src/app/models/message.model';
import { CryptoService } from './services/crypto.service';
import { MessageService } from 'src/app/services--/message.service';
import { BackendService } from 'src/app/services--/backend.service--';
import { FeedbackService } from 'src/app/services--/feedback.service';

/**
 * Crypto component allowing you to administrate your server's cryptography keys.
 */
@Component({
  selector: 'app-crypto',
  templateUrl: './crypto.component.html'
})
export class CryptoComponent {

  // Subscription for messages published by other components.
  private subscription: Subscription;

  /**
   * If true, we should show the import public key part.
   */
  showImport = true;

  /**
   * Import key model for key imported by other users.
   */
  importKey = '';

  /**
   * Subject for import key.
   */
  importSubject = '';

  /**
   * Email for import key.
   */
  importEmail = '';

  /**
   * Domain for import key.
   */
  importDomain = '';

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatTabGroup, {static: false}) tab: MatTabGroup;

  /**
   * Creates an instance of your component.
   *
   * @param cryptoService Needed to be able to import public keys
   * @param messageService Needed to subscribe to messages published by other components
   * @param backendService Needed to determine access rights of user
   * @param feedbackService Needed to show user feedback
   */
  constructor(
    private cryptoService: CryptoService,
    private messageService: MessageService,
    public backendService: BackendService,
    private feedbackService: FeedbackService) { }

  /**
   * Implementtation of OnInit.
   */
  ngOnInit() {
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {
      if (msg.name === 'crypto.receipts.show') {
        this.tab.selectedIndex = 1;

        /*
         * This looks a bit funny, but we need the receipt component to run through its initialisation
         * process before we can transmit the message responsible for applying the correct filter.
         */
        setTimeout(() => {
          this.messageService.sendMessage({
            name: 'crypto.receipts.key-id',
            content: msg.content,
          });
        }, 1);
      }
    });
  }

  /**
   * Implementation of OnDestroy.
   */
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /**
   * Invoked when user tries to import a key.
   */
  importPublicKey() {
    this.cryptoService.importPublicKey(
      this.importSubject,
      this.importEmail,
      this.importDomain,
      this.importKey).subscribe({
        next: () => {
          this.feedbackService.showInfo('Key was sucessfully imported');
          this.showImport = false;
        },
        error: (error: any) => this.feedbackService.showError(error)});
  }
}
