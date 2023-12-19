
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PrivacyDialogComponent } from 'src/app/components/legal/privacy-dialog/privacy-dialog.component';
import { TermsDialogComponent } from 'src/app/components/legal/terms-dialog/terms-dialog.component';

declare function aista_show_chat_window(): any;

/**
 * Footer component showing copyright and terms of service, plus privacy declaration.
 */
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {

  constructor(private dialog: MatDialog) { }

  termsModal() {

    this.dialog.open(TermsDialogComponent);
  }

  privacyModal() {

    this.dialog.open(PrivacyDialogComponent);
  }
}
