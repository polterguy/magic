
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { GeneralService } from 'src/app/_general/services/general.service';
import { PublicKeyFull } from './_models/public-key-full.model';
import { CryptoService } from './_services/crypto.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { PublicKey } from './_models/public-key.model';
import { MatDialog } from '@angular/material/dialog';
import { NewServerKeyComponent } from './components/new-server-key/new-server-key.component';

@Component({
  selector: 'app-server-key',
  templateUrl: './server-key.component.html',
  styleUrls: ['./server-key.component.scss']
})
export class ServerKeyComponent implements OnInit {

  /**
   * Server's public key information.
   */
  public publicKeyFull: PublicKeyFull = null;

  public selectedTabIndex: number = 0;

  public selectedServerKey: PublicKey;

  public isNewKey: boolean = undefined;

  @ViewChild('tableComponent') tableComponent: any;

  constructor(
    private dialog: MatDialog,
    private clipboard: Clipboard,
    private cryptoService: CryptoService,
    private generalService: GeneralService) { }

  ngOnInit(): void {
    this.getServerPublicKey();
  }

  /*
   * Retrieves the server's public key.
   */
  private getServerPublicKey() {
    this.cryptoService.serverPublicKey().subscribe({
      next: (key: any) => {
        if (key.result === 'FAILURE') {
          this.generalService.showFeedback('No server key pair found, please create one', 'errorMessage');
          return;
        }
        this.publicKeyFull = <PublicKeyFull>key;
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  public copy(text: string) {
    this.clipboard.copy(text);
    this.generalService.showFeedback('Copied to your clipboard');
  }

  public tabChanged(event: any) {
    this.selectedTabIndex = event;
  }

  public invokeViewReceipts(event: any) {
    if (event.key === this.selectedServerKey) {
      this.isNewKey = false;
    } else {
      this.isNewKey = true;
    }
    this.selectedServerKey = event.key;
    this.selectedTabIndex = event.index;
  }

  public newKey(type: string) {
    this.dialog.open(NewServerKeyComponent, {
      width: '800px',
      data: {
        type: type
      }
    }).afterClosed().subscribe((result: any) => {
      if (result === true) {
        this.tableComponent.getKeys();
        this.tableComponent.getCount();
        if (type === 'create') {
          this.getServerPublicKey();
        }
      }
    })
  }
}
