
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Input, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { GeneralService } from 'src/app/_general/services/general.service';
import { CryptoInvocation } from '../_models/crypto-invocations.model';
import { PublicKey } from '../_models/public-key.model';
import { CryptoService } from '../_services/crypto.service';

/**
 * Helper component displaying receipts for crypto invocations towards the server.
 */
@Component({
  selector: 'app-cryptography-receipts',
  templateUrl: './cryptography-receipts.component.html'
})
export class CryptographyReceiptsComponent implements OnInit {

  @Input() selectedServerKey: PublicKey;

  dataSource: any = [];
  isLoading: boolean = true;
  pageIndex: number = 0;
  pageSize: number = 5;
  totalItems: number = 0;
  displayedColumns: string[] = [
    'request',
    'response',
    'created',
  ];

  constructor(
    private cryptoService: CryptoService,
    private generalService: GeneralService) { }

  ngOnInit() {

    this.getInvocations();
  }

  changePage(e: PageEvent) {

    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
    this.getInvocations(false);
  }

  /*
   * Private helper methods
   */

  private getInvocations(countItems: boolean = true) {

    this.generalService.showLoading();

    const filter: any = {};
    if (this.selectedServerKey) {
      filter.crypto_key = this.selectedServerKey.id;
    }

    this.cryptoService.invocations({
      filter,
      offset: this.pageIndex * this.pageSize,
      limit: this.pageSize
    }).subscribe({
      next: (invocations: CryptoInvocation[]) => {

        this.dataSource = invocations || [];

        if (!countItems) {

          this.generalService.hideLoading();
          return;
        }
        this.getCount();
      },
      error: (error: any) =>{

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }

  private getCount() {

    const filter: any = {};
    if (this.selectedServerKey) {
      filter.crypto_key = this.selectedServerKey.id;
    }

    this.cryptoService.countInvocations({ filter: filter }).subscribe({
      next: (res) => {

        this.generalService.hideLoading();
        this.isLoading = false;
        this.totalItems = res.count
      },
      error: (error: any) =>{

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }
}
