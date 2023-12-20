
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system specific imports
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Utility imports
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';

// Application specific imports
import { IdeComponent } from 'src/app/components/protected/create/hyper-ide/ide.component';
import { SharedModule } from 'src/app/modules/shared.module';
import { CommonComponentsModule } from 'src/app/components/protected/common/common-components.module';
import { IdeEditorComponent } from '../components/ide-editor/ide-editor.component';
import { IdeSearchboxComponent } from '../components/ide-searchbox/ide-searchbox.component';
import { IdeTreeComponent } from '../components/ide-tree/ide-tree.component';
import { IdeRoutingModule } from './ide.routing.module';
import { IncompatibleFileDialogComponent } from '../components/incompatible-file-dialog/incompatible-file-dialog.component';
import { NewFileFolderDialogComponent } from '../components/new-file-folder-dialog/new-file-folder-dialog.component';
import { RenameFileDialogComponent } from '../components/rename-file-dialog/rename-file-dialog.component';
import { RenameFolderDialogComponent } from '../components/rename-folder-dialog/rename-folder-dialog.component';
import { UnsavedChangesDialogComponent } from '../components/unsaved-changes-dialog/unsaved-changes-dialog.component';
import { ExecuteResult } from '../components/execute-result-dialog/execute-result-dialog.component';
import { ParametriseActionDialog } from '../components/parametrise-action-dialog/parametrise-action-dialog.component';

@NgModule({
  declarations: [
    IdeComponent,
    IdeTreeComponent,
    IdeEditorComponent,
    IdeSearchboxComponent,
    ExecuteResult,
    IncompatibleFileDialogComponent,
    NewFileFolderDialogComponent,
    RenameFileDialogComponent,
    RenameFolderDialogComponent,
    UnsavedChangesDialogComponent,
    ParametriseActionDialog,
  ],
  imports: [
    CommonModule,
    IdeRoutingModule,
    CommonComponentsModule,
    SharedModule,
    FormlyModule.forRoot(),
    FormlyMaterialModule,
  ]
})
export class IdeModule { }
