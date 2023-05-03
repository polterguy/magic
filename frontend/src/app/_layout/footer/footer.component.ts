
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PrivacyModalComponent } from 'src/app/_general/components/privacy-modal/privacy-modal.component';
import { TermsModalComponent } from 'src/app/_general/components/terms-modal/terms-modal.component';

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

    this.dialog.open(TermsModalComponent);
  }

  privacyModal() {

    this.dialog.open(PrivacyModalComponent);
  }
}
