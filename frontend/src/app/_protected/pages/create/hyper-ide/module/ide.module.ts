
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IdeComponent } from '../ide.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { MaterialModule } from 'src/app/material.module';
import { SharedModule } from 'src/app/shared.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { IdeEditorComponent } from '../components/ide-editor/ide-editor.component';
import { IdeSearchboxComponent } from '../components/ide-searchbox/ide-searchbox.component';
import { IdeTreeComponent } from '../components/ide-tree/ide-tree.component';
import { IdeRoutingModule } from './ide.routing.module';
import { ExecuteMacroDialogComponent } from '../components/execute-macro-dialog/execute-macro-dialog.component';
import { IncompatibleFileDialogComponent } from '../components/incompatible-file-dialog/incompatible-file-dialog.component';
import { NewFileFolderDialogComponent } from '../components/new-file-folder-dialog/new-file-folder-dialog.component';
import { RenameFileDialogComponent } from '../components/rename-file-dialog/rename-file-dialog.component';
import { RenameFolderDialogComponent } from '../components/rename-folder-dialog/rename-folder-dialog.component';
import { SelectMacroDialogComponent } from '../components/select-macro-dialog/select-macro-dialog.component';
import { UnsavedChangesDialogComponent } from '../components/unsaved-changes-dialog/unsaved-changes-dialog.component';
import { OpenAIConfigurationDialogComponent } from '../../../../../_general/components/openai/openai-configuration-dialog/openai-configuration-dialog.component';
import { OpenAIAnswerDialogComponent } from '../../../../../_general/components/openai/openai-answer-dialog/openai-answer-dialog.component';
import { OpenAITrainingDialogComponent } from '../../../../../_general/components/openai/openai-training-dialog/openai-training-dialog.component';
import { CmModule } from 'src/app/codemirror/_module/cm.module';
import { OpenaiPromptComponent } from '../../../../../_general/components/openai/openai-prompt/openai-prompt.component';

@NgModule({
  declarations: [
    IdeComponent,
    IdeTreeComponent,
    IdeEditorComponent,
    IdeSearchboxComponent,
    ExecuteMacroDialogComponent,
    IncompatibleFileDialogComponent,
    NewFileFolderDialogComponent,
    RenameFileDialogComponent,
    RenameFolderDialogComponent,
    SelectMacroDialogComponent,
    UnsavedChangesDialogComponent,
    OpenAIAnswerDialogComponent,
    OpenAIConfigurationDialogComponent,
    OpenAITrainingDialogComponent,
    OpenaiPromptComponent,
  ],
  imports: [
    CommonModule,
    IdeRoutingModule,
    ComponentsModule,
    MaterialModule,
    CodemirrorModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    CmModule,
  ]
})
export class IdeModule { }
