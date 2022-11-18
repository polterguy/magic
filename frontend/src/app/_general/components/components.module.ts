
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
import { ShortkeysComponent } from './shortkeys/shortkeys.component';
import { LoadSnippetDialogComponent } from './load-snippet-dialog/load-snippet-dialog.component';
import { QueryParamsComponent } from './query-params/query-params.component';
import { AssumptionsComponent } from './assumptions/assumptions.component';
import { CreateAssumptionTestDialogComponent } from './create-assumption-test-dialog/create-assumption-test-dialog.component';
import { SnippetNameDialogComponent } from './snippet-name-dialog/snippet-name-dialog.component';
import { EndpointDialogComponent } from './endpoint-dialog/endpoint-dialog.component';



@NgModule({
  declarations: [
      TermsModalComponent,
      PrivacyModalComponent,
      BackendsListComponent,
      LoadingSkeletonComponent,
      DialogComponent,
      ConfirmationDialogComponent,
      ShortkeysComponent,
      LoadSnippetDialogComponent,
      QueryParamsComponent,
      AssumptionsComponent,
      CreateAssumptionTestDialogComponent,
      SnippetNameDialogComponent,
      EndpointDialogComponent
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
    ConfirmationDialogComponent,
    ShortkeysComponent,
    LoadSnippetDialogComponent,
    QueryParamsComponent,
    AssumptionsComponent,
    CreateAssumptionTestDialogComponent,
    SnippetNameDialogComponent,
    EndpointDialogComponent
  ]
})
export class ComponentsModule { }
