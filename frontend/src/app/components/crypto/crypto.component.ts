
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { MatTabGroup } from '@angular/material/tabs';
import { Component, ViewChild } from '@angular/core';

// Application specific imports.
import { Message } from 'src/app/models/message.model';
import { MessageService } from 'src/app/services/message.service';

/**
 * Crypto component allowing you to administrate your server's cryptography keys.
 */
@Component({
  selector: 'app-crypto',
  templateUrl: './crypto.component.html',
  styleUrls: ['./crypto.component.scss']
})
export class CryptoComponent {

  // Subscription for messages published by other components.
   private subscription: Subscription;

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatTabGroup, {static: true}) public tab: MatTabGroup;

  constructor(private messageService: MessageService) { }

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
}
