
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
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
import { ExecuteEndpointDialogComponent } from './execute-endpoint-dialog/execute-endpoint-dialog.component';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { GithubTokenDialogComponent } from '../../_protected/pages/user/generate-token-dialog/generate-token-dialog.component';
import { PwaUpdateDialogComponent } from './pwa-update-dialog/pwa-update-dialog.component';
import { LogItemDetailsComponent } from './log-item-details/log-item-details.component';
import { SearchboxComponent } from 'src/app/_protected/pages/manage/plugins/components/searchbox/searchbox.component';
import { ConfigureThemeDialog } from '../../_protected/pages/dashboard/components/configure-theme/configure-theme-dialog.component';
import { OpenAIAnswerDialogComponent } from './openai/openai-answer-dialog/openai-answer-dialog.component';
import { OpenAIConfigurationDialogComponent } from './openai/openai-configuration-dialog/openai-configuration-dialog.component';
import { OpenAITrainingDialogComponent } from './openai/openai-training-dialog/openai-training-dialog.component';
import { OpenAIPromptComponent } from './openai/openai-prompt/openai-prompt.component';

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
    ExecuteEndpointDialogComponent,
    GithubTokenDialogComponent,
    PwaUpdateDialogComponent,
    LogItemDetailsComponent,
    SearchboxComponent,
    ConfigureThemeDialog,
    OpenAIAnswerDialogComponent,
    OpenAIConfigurationDialogComponent,
    OpenAITrainingDialogComponent,
    OpenAIPromptComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CodemirrorModule,
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
    ExecuteEndpointDialogComponent,
    GithubTokenDialogComponent,
    LogItemDetailsComponent,
    SearchboxComponent,
    OpenAIAnswerDialogComponent,
    OpenAIConfigurationDialogComponent,
    OpenAITrainingDialogComponent,
    OpenAIPromptComponent,
  ]
})
export class ComponentsModule { }
