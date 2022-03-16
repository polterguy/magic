
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
import { AuthService } from '../../../services/auth.service';
import { MessageService } from 'src/app/services/message.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { BackendService } from 'src/app/services/backend.service';

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
  public showImport = true;

  /**
   * Import key model for key imported by other users.
   */
  public importKey = '';

  /**
   * Subject for import key.
   */
  public importSubject = '';

  /**
   * Email for import key.
   */
  public importEmail = '';

  /**
   * Domain for import key.
   */
  public importDomain = '';

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatTabGroup, {static: false}) public tab: MatTabGroup;

  /**
   * Creates an instance of your component.
   * 
   * @param authService Needed to check role of currently authenticated user
   * @param cryptoService Needed to be able to import public keys
   * @param messageService Needed to subscribe to messages published by other components
   * @param feedbackService Needed to show user feedback
   */
  constructor(
    public authService: AuthService,
    private cryptoService: CryptoService,
    private messageService: MessageService,
    private backendService: BackendService,
    private feedbackService: FeedbackService) { }

  /**
   * Implementtation of OnInit.
   */
  public ngOnInit() {

    // Making sure we subscribe to relevant messages.
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {
      if (msg.name === 'crypto.receipts.show') {

        // Caller wants to change active tab to the 'View invocations' tab.
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
  public ngOnDestroy() {

    // House cleaning.
    this.subscription.unsubscribe();
  }

  /**
   * Returns true if user is root.
   */
  public isRoot() {

    // Returning true if user belongs to the root role
    return this.authService.authenticated && this.backendService.current?.token?.in_role('root');
  }

  /**
   * Invoked when user tries to import a key.
   */
  public importPublicKey() {

    // Importing public key.
    this.cryptoService.importPublicKey(
      this.importSubject,
      this.importEmail,
      this.importDomain,
      this.importKey).subscribe(() => {

        // Showing user some feedback, and making sure we hide import card.
        this.feedbackService.showInfo('Key was sucessfully imported');
        this.showImport = false;

      }, (error: any) => this.feedbackService.showError(error));
  }
}
