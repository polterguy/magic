
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TermsDialogComponent } from './terms-dialog/terms-dialog.component';
import { PrivacyDialogComponent } from './privacy-dialog/privacy-dialog.component';

@NgModule({
  declarations: [
    TermsDialogComponent,
    PrivacyDialogComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    TermsDialogComponent,
    PrivacyDialogComponent,
  ]
})
export class LegalModule { }
