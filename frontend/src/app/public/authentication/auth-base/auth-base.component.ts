
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PrivacyModalComponent } from 'src/app/_general/components/privacy-modal/privacy-modal.component';
import { TermsModalComponent } from 'src/app/_general/components/terms-modal/terms-modal.component';

/**
 * Base component for everything related to authentication.
 */
@Component({
  selector: 'app-auth-base',
  templateUrl: './auth-base.component.html',
  styleUrls: ['./auth-base.component.scss']
})
export class AuthBaseComponent implements OnInit {

  constructor(private dialog: MatDialog) { }

  public currentYear: number = 0;

  public passwordToken: string = '';

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
