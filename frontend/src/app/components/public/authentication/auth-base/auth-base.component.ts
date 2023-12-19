
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PrivacyDialogComponent } from 'src/app/components/legal/privacy-dialog/privacy-dialog.component';
import { TermsDialogComponent } from 'src/app/components/legal/terms-dialog/terms-dialog.component';

/**
 * Base component for everything related to authentication.
 */
@Component({
  selector: 'app-auth-base',
  templateUrl: './auth-base.component.html',
  styleUrls: ['./auth-base.component.scss']
})
export class AuthBaseComponent {

  constructor(private dialog: MatDialog) { }

  termsModal() {

    this.dialog.open(TermsDialogComponent);
  }

  privacyModal() {

    this.dialog.open(PrivacyDialogComponent);
  }
}
