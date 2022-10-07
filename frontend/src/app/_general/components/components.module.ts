
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TermsModalComponent } from './terms-modal/terms-modal.component';
import { PrivacyModalComponent } from './privacy-modal/privacy-modal.component';
import { BackendsListComponent } from './backends-list/backends-list.component';
import { LoadingSkeletonComponent } from './loading-skeleton/loading-skeleton.component';
import { DialogComponent } from './dialog/dialog.component';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';



@NgModule({
  declarations: [
      TermsModalComponent,
      PrivacyModalComponent,
      BackendsListComponent,
      LoadingSkeletonComponent,
      DialogComponent,
      ConfirmationDialogComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    TermsModalComponent,
    PrivacyModalComponent,
    BackendsListComponent,
    LoadingSkeletonComponent,
    DialogComponent,
    ConfirmationDialogComponent
  ]
})
export class ComponentsModule { }
