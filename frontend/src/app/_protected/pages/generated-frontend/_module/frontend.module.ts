import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FrontendRoutingModule } from './frontend.routing.module';
import { GeneratedFrontendComponent } from '../generated-frontend.component';
import { FrontendTreeComponent } from '../components/frontend-tree/frontend-tree.component';
import { FrontendEditorComponent } from '../components/frontend-editor/frontend-editor.component';
import { FrontendSearchboxComponent } from '../components/frontend-searchbox/frontend-searchbox.component';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule } from '@angular/forms';
import { IncompatibleFileDialogComponent } from '../components/incompatible-file-dialog/incompatible-file-dialog.component';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { UnsavedChangesDialogComponent } from '../components/unsaved-changes-dialog/unsaved-changes-dialog.component';
import { RenameFileDialogComponent } from '../components/rename-file-dialog/rename-file-dialog.component';
import { NewFileFolderDialogComponent } from '../components/new-file-folder-dialog/new-file-folder-dialog.component';
import { RenameFolderDialogComponent } from '../components/rename-folder-dialog/rename-folder-dialog.component';
import { SelectMacroDialogComponent } from '../components/select-macro-dialog/select-macro-dialog.component';
import { ExecuteMacroDialogComponent } from '../components/execute-macro-dialog/execute-macro-dialog.component';
import { LoadSnippetDialogComponent } from '../../evaluator/load-snippet-dialog/load-snippet-dialog.component';
import { ExecuteEndpointDialogComponent } from '../components/execute-endpoint-dialog/execute-endpoint-dialog.component';



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
    LoadSnippetDialogComponent,
    ExecuteEndpointDialogComponent
  ],
  imports: [
    CommonModule,
    FrontendRoutingModule,
    ComponentsModule,
    MaterialModule,
    CodemirrorModule,
    FormsModule
  ]
})
export class FrontendModule { }
