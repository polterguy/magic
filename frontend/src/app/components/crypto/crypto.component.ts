
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { MatTabGroup } from '@angular/material/tabs';
import { Component, ViewChild } from '@angular/core';

/**
 * Crypto component allowing you to administrate your server's cryptography keys.
 */
@Component({
  selector: 'app-crypto',
  templateUrl: './crypto.component.html',
  styleUrls: ['./crypto.component.scss']
})
export class CryptoComponent {

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatTabGroup, {static: true}) public tab: MatTabGroup;
}
