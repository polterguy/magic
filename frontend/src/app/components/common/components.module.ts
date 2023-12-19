
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TermsModalComponent } from './terms-modal/terms-modal.component';
import { PrivacyModalComponent } from './privacy-modal/privacy-modal.component';
import { LoadingSkeletonComponent } from './loading-skeleton/loading-skeleton.component';
import { DialogComponent } from './dialog/dialog.component';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { ShortkeysComponent } from './shortkeys/shortkeys.component';
import { LoadSnippetDialogComponent } from './load-snippet-dialog/load-snippet-dialog.component';
import { SnippetNameDialogComponent } from './snippet-name-dialog/snippet-name-dialog.component';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { GenerateTokenDialogComponent } from 'src/app/components/protected/user/generate-token-dialog/generate-token-dialog.component';
import { PwaUpdateDialogComponent } from './pwa-update-dialog/pwa-update-dialog.component';
import { LogItemDetailsComponent } from './log-item-details/log-item-details.component';
import { SearchboxComponent } from 'src/app/components/common/searchbox/searchbox.component';
import { ConfigureThemeDialog } from 'src/app/components/protected/dashboard/components/configure-theme/configure-theme-dialog.component';
import { OpenAIAnswerDialogComponent } from './openai/openai-answer-dialog/openai-answer-dialog.component';
import { OpenAIConfigurationDialogComponent } from './openai/openai-configuration-dialog/openai-configuration-dialog.component';
import { OpenAIPromptComponent } from './openai/openai-prompt/openai-prompt.component';
import { CodemirrorSqlComponent } from './codemirror-sql/codemirror-sql.component';
import { CodemirrorHyperlambdaComponent } from './codemirror-hyperlambda/codemirror-hyperlambda.component';

@NgModule({
  declarations: [
    TermsModalComponent,
    PrivacyModalComponent,
    LoadingSkeletonComponent,
    DialogComponent,
    ConfirmationDialogComponent,
    ShortkeysComponent,
    LoadSnippetDialogComponent,
    SnippetNameDialogComponent,
    GenerateTokenDialogComponent,
    PwaUpdateDialogComponent,
    LogItemDetailsComponent,
    SearchboxComponent,
    ConfigureThemeDialog,
    OpenAIAnswerDialogComponent,
    OpenAIConfigurationDialogComponent,
    OpenAIPromptComponent,
    CodemirrorSqlComponent,
    CodemirrorHyperlambdaComponent,
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
    LoadingSkeletonComponent,
    DialogComponent,
    ConfirmationDialogComponent,
    ShortkeysComponent,
    LoadSnippetDialogComponent,
    SnippetNameDialogComponent,
    GenerateTokenDialogComponent,
    LogItemDetailsComponent,
    SearchboxComponent,
    OpenAIAnswerDialogComponent,
    OpenAIConfigurationDialogComponent,
    OpenAIPromptComponent,
    CodemirrorSqlComponent,
    CodemirrorHyperlambdaComponent,
  ]
})
export class ComponentsModule { }
