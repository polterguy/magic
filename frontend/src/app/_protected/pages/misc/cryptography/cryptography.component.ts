
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { GeneralService } from 'src/app/_general/services/general.service';
import { PublicKeyFull } from './_models/public-key-full.model';
import { CryptoService } from './_services/crypto.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { PublicKey } from './_models/public-key.model';
import { MatDialog } from '@angular/material/dialog';
import { NewServerKeyComponent } from './components/new-server-key/new-server-key.component';

/**
 * Helper component for viewing cryptography keys, both public keys and server keys,
 * in addition to receipts associated with keys.
 */
@Component({
  selector: 'app-cryptography',
  templateUrl: './cryptography.component.html',
  styleUrls: ['./cryptography.component.scss']
})
export class CryptographyComponent implements OnInit {

  @ViewChild('tableComponent') tableComponent: any;
  publicKeyFull: PublicKeyFull = null;
  selectedTabIndex: number = 0;
  selectedServerKey: PublicKey;

  constructor(
    private dialog: MatDialog,
    private clipboard: Clipboard,
    private cryptoService: CryptoService,
    private generalService: GeneralService) { }

  ngOnInit() {

    this.getServerPublicKey();
  }

  copy(text: string) {

    this.clipboard.copy(text);
    this.generalService.showFeedback('Public key can be found on your clipboard', 'successMessage');
  }

  tabChanged(event: any) {

    this.selectedTabIndex = event;
    if (this.selectedTabIndex === 0) {
      this.selectedServerKey = null;
    }
  }

  invokeViewReceipts(event: any) {

    this.selectedServerKey = event.key;
    this.selectedTabIndex = event.index;
  }

  newKey(type: string) {

    this.dialog.open(NewServerKeyComponent, {
      width: '800px',
      data: {
        type: type
      }
    }).afterClosed().subscribe((result: any) => {

      if (result === true) {

        this.tableComponent.getKeys();
        if (type === 'create') {

          this.getServerPublicKey();
        }
      }
    });
  }

  /*
   * Private helper methods.
   */

  private getServerPublicKey() {

    this.generalService.showLoading();
    this.cryptoService.serverPublicKey().subscribe({
      next: (key: any) => {
        if (key.result === 'FAILURE') {

          this.generalService.showFeedback('No server key pair found, please create one', 'errorMessage');
          return;
        }
        this.publicKeyFull = <PublicKeyFull>key;
      },
      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }
}
