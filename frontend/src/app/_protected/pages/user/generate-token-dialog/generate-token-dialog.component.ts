
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { CryptoService } from 'src/app/_protected/pages/misc/cryptography/_services/crypto.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { GeneralService } from '../../../../_general/services/general.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Role } from '../../manage/user-and-roles/_models/role.model';
import { RoleService } from '../../manage/user-and-roles/_services/role.service';

/**
 * Helper modal dialog to generate a new JWT token.
 */
@Component({
  selector: 'app-generate-token-dialog',
  templateUrl: './generate-token-dialog.component.html',
  styleUrls: ['./generate-token-dialog.component.scss']
})
export class GenerateTokenDialogComponent implements OnInit {

  token: string = '';
  today: Date;
  roles: Role[] = [];

  constructor(
    private clipboard: Clipboard,
    private generalService: GeneralService,
    private roleService: RoleService,
    private cryptoService: CryptoService,
    @Inject(MAT_DIALOG_DATA) public data: { username: string, roles: string[], expires: string }) { }

  ngOnInit() {

    this.today = new Date();
    this.generalService.showLoading();

    this.roleService.list().subscribe({
      next: (res: Role[]) => {

        this.roles = res || [];
        this.generateToken();
      },
      error: (error: any) => {

        this.generalService.showFeedback(error?.error?.message, 'errorMessage', 'Ok', 5000);
      }
    });
  }

  generateToken() {

    this.generalService.showLoading();
    this.cryptoService.generateToken(
      this.data.username,
      this.data.roles.join(','),
      new Date(this.data.expires).toISOString()).subscribe({

      next: (res: any) => {

        this.generalService.hideLoading();
        this.token = res.ticket;
      },
      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }

  copy() {

    this.clipboard.copy(this.token);
    this.generalService.showFeedback('Token can be found on your clipboard', 'successMessage');
  }
}
