
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { PublicKeyDetailsComponent } from '../components/public-key-details/public-key-details.component';
import { PublicKey } from '../_models/public-key.model';
import { CryptoService } from '../_services/crypto.service';

/**
 * Helper component for displaying public keys cloudlet has stored.
 */
@Component({
  selector: 'app-cryptography-public-keys',
  templateUrl: './cryptography-public-keys.component.html',
  styleUrls: ['./cryptography-public-keys.component.scss']
})
export class CryptographyPublicKeysComponent implements OnInit {

  @Output() invokeViewReceipts: EventEmitter<any> = new EventEmitter<any>();

  isLoading: boolean = true;
  dataSource: any = [];
  pageIndex: number = 0;
  pageSize: number = 5;
  totalItems: number = 0;
  displayedColumns: string[] = [
    'name',
    'domain',
    'email',
    'created',
    'enabled',
    'actions'
  ];

  constructor(
    private dialog: MatDialog,
    private cryptoService: CryptoService,
    private generalService: GeneralService) { }

  ngOnInit() {

    this.getKeys();
  }

  deleteKey(key: PublicKey) {

    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Delete ${key.subject}`,
        description_extra: `You are deleting the public key belonging to <br/><span class="fw-bold">${key.subject} - ${key.email}</span> <br/><br/> Do you want to continue?`,
        action_btn: 'Delete',
        action_btn_color: 'warn',
        bold_description: true
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {
        this.cryptoService.deletePublicKey(key.id).subscribe({
          next: () => {
            this.generalService.showFeedback('Public key successfully deleted', 'successMessage');
            this.getKeys();
            this.getCount();
          },
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
        });
      }
    });
  }

  enabledChanged(event: any, key: PublicKey) {

    this.cryptoService.setEnabled(key.id, event.checked).subscribe({
      next: () => {

        this.generalService.showFeedback(`Key was successfully ${event.checked ? 'enabled' : 'disabled'}`, 'successMessage')
        this.getKeys();
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  viewDetails(key: PublicKey) {

    const keyData: any = { ...key };
    keyData.original_content = key.content;
    this.dialog.open(PublicKeyDetailsComponent, {
      width: '80vw',
      panelClass: ['light'],
      data: {
        key: keyData,
      }
    }).afterClosed().subscribe((res: any) => {
      if (res === true) {
        this.getKeys();
      }
    })
  }

  viewReceipts(key: PublicKey) {

    const event: any = {
      key: key,
      index: 1
    };
    this.invokeViewReceipts.emit(event);
  }

  changePage(e: PageEvent) {

    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
    this.getKeys(false);
  }

  /*
   * Private helper methods
   */

  private getKeys(countItems: boolean = true) {

    this.generalService.showLoading();
    this.cryptoService.publicKeys({
      filter: '',
      offset: this.pageIndex * this.pageSize,
      limit: this.pageSize
    }).subscribe({
      next: (keys: PublicKey[]) => {

        this.dataSource = keys || [];
        if (!countItems) {
          this.generalService.hideLoading();
          this.isLoading = false;
          return;
        }
        this.getCount();
      },
      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }

  private getCount() {

    const filter: string = '';
    this.cryptoService.countPublicKeys({ filter: filter }).subscribe({
      next: (res) => {

        this.generalService.hideLoading();
        this.totalItems = res.count;
        this.isLoading = false;
      },

      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }
}
