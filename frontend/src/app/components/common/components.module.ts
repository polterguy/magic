
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TermsDialogComponent } from './terms-dialog/terms-dialog.component';
import { PrivacyDialogComponent } from './privacy-dialog/privacy-dialog.component';
import { LoadingSkeletonComponent } from '../protected/common/loading-skeleton/loading-skeleton.component';
import { DialogComponent } from '../protected/common/dialog/dialog.component';
import { ConfirmationDialogComponent } from '../protected/common/confirmation-dialog/confirmation-dialog.component';
import { ShortkeysDialogComponent } from '../protected/common/shortkeys-dialog/shortkeys-dialog.component';
import { LoadSnippetDialogComponent } from '../protected/common/load-snippet-dialog/load-snippet-dialog.component';
import { SaveSnippetDialogComponent } from '../protected/common/save-snippet-dialog/save-snippet-dialog.component';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { GenerateTokenDialogComponent } from 'src/app/components/protected/user/generate-token-dialog/generate-token-dialog.component';
import { PwaUpdateDialogComponent } from '../protected/common/pwa-update-dialog/pwa-update-dialog.component';
import { LogItemDialogComponent } from '../protected/common/log-item-dialog/log-item-dialog.component';
import { FilterComponent } from 'src/app/components/protected/common/filter/filter.component';
import { ConfigureThemeDialog } from 'src/app/components/protected/dashboard/components/configure-theme/configure-theme-dialog.component';
import { OpenAIAnswerDialogComponent } from '../protected/common/openai/openai-answer-dialog/openai-answer-dialog.component';
import { OpenAIConfigurationDialogComponent } from '../protected/common/openai/openai-configuration-dialog/openai-configuration-dialog.component';
import { OpenAIPromptComponent } from '../protected/common/openai/openai-prompt/openai-prompt.component';
import { CodemirrorSqlComponent } from '../protected/common/codemirror-sql/codemirror-sql.component';
import { CodemirrorHyperlambdaComponent } from '../protected/common/codemirror-hyperlambda/codemirror-hyperlambda.component';

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
