
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TermsDialogComponent } from '../../common/terms-dialog/terms-dialog.component';
import { PrivacyDialogComponent } from '../../common/privacy-dialog/privacy-dialog.component';
import { LoadingSkeletonComponent } from './loading-skeleton/loading-skeleton.component';
import { DialogComponent } from './dialog/dialog.component';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { ShortkeysDialogComponent } from './shortkeys-dialog/shortkeys-dialog.component';
import { LoadSnippetDialogComponent } from './load-snippet-dialog/load-snippet-dialog.component';
import { SaveSnippetDialogComponent } from './save-snippet-dialog/save-snippet-dialog.component';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { GenerateTokenDialogComponent } from 'src/app/components/protected/user/generate-token-dialog/generate-token-dialog.component';
import { PwaUpdateDialogComponent } from './pwa-update-dialog/pwa-update-dialog.component';
import { LogItemDialogComponent } from './log-item-dialog/log-item-dialog.component';
import { FilterComponent } from 'src/app/components/protected/common/filter/filter.component';
import { ConfigureThemeDialog } from 'src/app/components/protected/dashboard/components/configure-theme/configure-theme-dialog.component';
import { OpenAIAnswerDialogComponent } from './openai/openai-answer-dialog/openai-answer-dialog.component';
import { OpenAIConfigurationDialogComponent } from './openai/openai-configuration-dialog/openai-configuration-dialog.component';
import { OpenAIPromptComponent } from './openai/openai-prompt/openai-prompt.component';
import { CodemirrorSqlComponent } from './codemirror-sql/codemirror-sql.component';
import { CodemirrorHyperlambdaComponent } from './codemirror-hyperlambda/codemirror-hyperlambda.component';

@NgModule({
  declarations: [
    TermsDialogComponent,
    PrivacyDialogComponent,
    LoadingSkeletonComponent,
    DialogComponent,
    ConfirmationDialogComponent,
    ShortkeysDialogComponent,
    LoadSnippetDialogComponent,
    SaveSnippetDialogComponent,
    GenerateTokenDialogComponent,
    PwaUpdateDialogComponent,
    LogItemDialogComponent,
    FilterComponent,
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
    TermsDialogComponent,
    PrivacyDialogComponent,
    LoadingSkeletonComponent,
    DialogComponent,
    ConfirmationDialogComponent,
    ShortkeysDialogComponent,
    LoadSnippetDialogComponent,
    SaveSnippetDialogComponent,
    GenerateTokenDialogComponent,
    LogItemDialogComponent,
    FilterComponent,
    OpenAIAnswerDialogComponent,
    OpenAIConfigurationDialogComponent,
    OpenAIPromptComponent,
    CodemirrorSqlComponent,
    CodemirrorHyperlambdaComponent,
  ]
})
export class ComponentsModule { }
