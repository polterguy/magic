
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PrivacyModalComponent } from 'src/app/_general/components/privacy-modal/privacy-modal.component';
import { TermsModalComponent } from 'src/app/_general/components/terms-modal/terms-modal.component';

/**
 * Footer component showing copyright and terms of service, plus privacy declaration.
 */
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  constructor(private dialog: MatDialog) { }
  /**
   * copyright year
   */
  public currentYear: number = 0;

  ngOnInit() {
    this.currentYear = new Date().getFullYear();
  }

  public termsModal() {
    this.dialog.open(TermsModalComponent);
  }

  public privacyModal() {
    this.dialog.open(PrivacyModalComponent);
  }
}
