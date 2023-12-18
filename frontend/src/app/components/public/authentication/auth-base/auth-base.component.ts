
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PrivacyModalComponent } from 'src/app/components/common/privacy-modal/privacy-modal.component';
import { TermsModalComponent } from 'src/app/components/common/terms-modal/terms-modal.component';

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

    this.dialog.open(TermsModalComponent);
  }

  privacyModal() {

    this.dialog.open(PrivacyModalComponent);
  }
}
