
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { MatTabGroup } from '@angular/material/tabs';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

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
export class CryptoComponent implements OnInit, OnDestroy {

  /**
   * Subscription for messages published by other components.
   */
  private _subscription: Subscription;

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatTabGroup, {static: true}) public tab: MatTabGroup;

  /**
   * Creates an instance of your component.
   * 
   * @param messageService Needed to subscribe to relevant messages, specifically active tab change requests
   */
  constructor(private messageService: MessageService) { }

  /**
   * Implementtation of OnInit.
   */
  public ngOnInit() {

    // Making sure we subscribe to relevant messages.
    this._subscription = this.messageService.subscriber().subscribe((msg: Message) => {
      if (msg.name === 'crypto.view-invocations') {

        // Caller wants to change active tab to the 'View invocations' tab.
        this.tab.selectedIndex = 1;
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
}
