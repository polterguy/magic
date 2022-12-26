
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IdeComponent } from '../ide.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { MaterialModule } from 'src/app/material.module';
import { SharedModule } from 'src/app/shared.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { IdeEditorComponent } from '../ide-editor/ide-editor.component';
import { IdeSearchboxComponent } from '../ide-searchbox/ide-searchbox.component';
import { IdeTreeComponent } from '../ide-tree/ide-tree.component';
import { IdeRoutingModule } from './ide.routing.module';
import { ExecuteMacroDialogComponent } from '../components/execute-macro-dialog/execute-macro-dialog.component';
import { IncompatibleFileDialogComponent } from '../components/incompatible-file-dialog/incompatible-file-dialog.component';
import { NewFileFolderDialogComponent } from '../components/new-file-folder-dialog/new-file-folder-dialog.component';
import { RenameFileDialogComponent } from '../components/rename-file-dialog/rename-file-dialog.component';
import { RenameFolderDialogComponent } from '../components/rename-folder-dialog/rename-folder-dialog.component';
import { SelectMacroDialogComponent } from '../components/select-macro-dialog/select-macro-dialog.component';
import { UnsavedChangesDialogComponent } from '../components/unsaved-changes-dialog/unsaved-changes-dialog.component';
import { CodeDialogComponent } from '../components/code-dialog/code-dialog.component';
import { ConfigureOpenaiComponent } from '../components/configure-openai/configure-openai.component';
import { TrainingDialogComponent } from '../components/training-dialog/training-dialog.component';

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
    CodeDialogComponent,
    ConfigureOpenaiComponent,
    TrainingDialogComponent,
  ],
  imports: [
    CommonModule,
    IdeRoutingModule,
    ComponentsModule,
    MaterialModule,
    CodemirrorModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ]
})
export class IdeModule { }
