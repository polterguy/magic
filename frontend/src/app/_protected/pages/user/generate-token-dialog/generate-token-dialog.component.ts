
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { CryptoService } from 'src/app/_protected/pages/misc/cryptography/_services/crypto.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { GeneralService } from '../../../../_general/services/general.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Helper modal dialog to generate a new JWT token.
 */
@Component({
  selector: 'app-generate-token-dialog',
  templateUrl: './generate-token-dialog.component.html',
  styleUrls: ['./generate-token-dialog.component.scss']
})
export class GenerateTokenDialogComponent implements OnInit {

  public token: string = '';

  public today: Date;

  constructor(
    private clipboard: Clipboard,
    private generalService: GeneralService,
    private cryptoService: CryptoService,
    @Inject(MAT_DIALOG_DATA) public data: { username: string, role: string, expires: string }) { }

  ngOnInit() {
    this.today = new Date();
    this.generateToken();
  }

  public generateToken() {
    this.cryptoService.generateToken(this.data.username, this.data.role, new Date(this.data.expires).toISOString()).subscribe({
      next: (res: any) => {
        this.token = res.ticket;
      },
      error: (error: any) => { }
    })
  }

  public copy() {
    this.clipboard.copy(this.token);
    this.generalService.showFeedback('Token can be found on your clipboard');
  }
}
