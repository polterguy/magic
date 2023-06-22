
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IdeComponent } from '../ide.component';
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
import { CmModule } from 'src/app/codemirror/_module/cm.module';

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
  ],
  imports: [
    CommonModule,
    IdeRoutingModule,
    ComponentsModule,
    SharedModule,
    CmModule,
  ]
})
export class IdeModule { }
