
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PrivacyModalComponent } from 'src/app/_general/components/privacy-modal/privacy-modal.component';
import { TermsModalComponent } from 'src/app/_general/components/terms-modal/terms-modal.component';

@Component({
  selector: 'app-auth-base',
  templateUrl: './auth-base.component.html',
  styleUrls: ['./auth-base.component.scss']
})
export class AuthBaseComponent implements OnInit {

  constructor(
    private dialog: MatDialog) {}
  /**
   * copyright year
   */
  public currentYear: number = 0;

  public passwordToken: string = '';

  ngOnInit() {
    this.currentYear = new Date().getFullYear();
  }

  public termsModal(){
    this.dialog.open(TermsModalComponent);
  }

  public privacyModal(){
    this.dialog.open(PrivacyModalComponent);
  }
}
