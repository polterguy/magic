
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
  selector: 'app-server-key-receipts',
  templateUrl: './server-key-receipts.component.html'
})
export class ServerKeyReceiptsComponent implements OnInit {

  @Input() selectedServerKey: PublicKey;

  displayedColumns: string[] = ['created', 'request', 'response'];

  public dataSource: any = [];

  pageIndex: number = 0;
  pageSize: number = 5;
  totalItems: number = 0;

  public isLoading: boolean = true;

  constructor(
    private cryptoService: CryptoService,
    private generalService: GeneralService) { }

  ngOnInit() {
    this.getInvocations();
    this.getCount();
  }

  /**
   * Retrieves invocations from backend.
   */
  private getInvocations() {
    this.isLoading = true;
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
        this.isLoading = false;
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  private getCount() {
    const filter: any = {};
    if (this.selectedServerKey) {
      filter.crypto_key = this.selectedServerKey.id;
    }
    this.cryptoService.countInvocations({ filter: filter }).subscribe({
      next: (res) => {
        this.totalItems = res.count
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  public changePage(e: PageEvent) {
    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
    this.getInvocations();
    this.getCount();
  }
}
