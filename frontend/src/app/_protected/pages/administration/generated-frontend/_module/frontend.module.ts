import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { MaterialModule } from 'src/app/material.module';
import { SharedModule } from 'src/app/shared.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { ExecuteEndpointDialogComponent } from '../components/execute-endpoint-dialog/execute-endpoint-dialog.component';
import { ExecuteMacroDialogComponent } from '../components/execute-macro-dialog/execute-macro-dialog.component';
import { FrontendEditorComponent } from '../frontend-editor/frontend-editor.component';
import { FrontendSearchboxComponent } from '../frontend-searchbox/frontend-searchbox.component';
import { FrontendTreeComponent } from '../frontend-tree/frontend-tree.component';
import { IncompatibleFileDialogComponent } from '../components/incompatible-file-dialog/incompatible-file-dialog.component';
import { NewFileFolderDialogComponent } from '../components/new-file-folder-dialog/new-file-folder-dialog.component';
import { RenameFileDialogComponent } from '../components/rename-file-dialog/rename-file-dialog.component';
import { RenameFolderDialogComponent } from '../components/rename-folder-dialog/rename-folder-dialog.component';
import { SelectMacroDialogComponent } from '../components/select-macro-dialog/select-macro-dialog.component';
import { UnsavedChangesDialogComponent } from '../components/unsaved-changes-dialog/unsaved-changes-dialog.component';
import { GeneratedFrontendComponent } from '../generated-frontend.component';
import { FrontendRoutingModule } from './frontend.routing.module';




@NgModule({
  declarations: [
    GeneratedFrontendComponent,
    FrontendTreeComponent,
    FrontendEditorComponent,
    FrontendSearchboxComponent,
    IncompatibleFileDialogComponent,
    UnsavedChangesDialogComponent,
    RenameFileDialogComponent,
    NewFileFolderDialogComponent,
    RenameFolderDialogComponent,
    SelectMacroDialogComponent,
    ExecuteMacroDialogComponent,
    ExecuteEndpointDialogComponent
  ],
  imports: [
    CommonModule,
    FrontendRoutingModule,
    ComponentsModule,
    MaterialModule,
    CodemirrorModule,
    FormsModule,
    SharedModule
  ]
})
export class FrontendModule { }
