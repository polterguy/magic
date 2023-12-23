
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
import { ExecuteResultDialog } from '../components/execute-result-dialog/execute-result-dialog.component';
import { ParametriseActionDialog } from '../components/parametrise-action-dialog/parametrise-action-dialog.component';
import { FormlySqlComponent } from '../components/parametrise-action-dialog/components/formly-sql/formly-sql.component';
import { FormlyKeyValueComponent } from '../components/parametrise-action-dialog/components/formly-key-value/formly-key-value.component';
import { CreateKeyValueDialogComponent } from '../components/parametrise-action-dialog/components/formly-key-value/components/create-key-value-dialog/create-key-value-dialog.component';
import { FormlyCSharpComponent } from '../components/parametrise-action-dialog/components/formly-csharp/formly-csharp.component';
import { FormlyArrayComponent } from '../components/parametrise-action-dialog/components/formly-array/formly-array.component';
import { CreateArrayDialogComponent } from '../components/parametrise-action-dialog/components/formly-array/components/create-array-dialog/create-array-dialog.component';
import { FormlyHyperlambdaComponent } from '../components/parametrise-action-dialog/components/formly-hyperlambda/formly-hyperlambda.component';
import { FormlyAutocompleteComponent } from '../components/parametrise-action-dialog/components/formly-autocomplete/formly-autocomplete.component';
import { FormlyAutocompleteTextareaComponent } from '../components/parametrise-action-dialog/components/formly-autocomplete-textarea/formly-autocomplete-textarea.component';
import { GetArgumentsDialog } from '../components/get-arguments-dialog/get-arguments-dialog.component';

@NgModule({
  declarations: [
    IdeComponent,
    IdeTreeComponent,
    IdeEditorComponent,
    IdeSearchboxComponent,
    ExecuteResultDialog,
    IncompatibleFileDialogComponent,
    NewFileFolderDialogComponent,
    RenameFileDialogComponent,
    RenameFolderDialogComponent,
    UnsavedChangesDialogComponent,
    ParametriseActionDialog,
    FormlySqlComponent,
    FormlyCSharpComponent,
    FormlyHyperlambdaComponent,
    FormlyKeyValueComponent,
    FormlyArrayComponent,
    FormlyAutocompleteComponent,
    FormlyAutocompleteTextareaComponent,
    CreateKeyValueDialogComponent,
    CreateArrayDialogComponent,
    GetArgumentsDialog,
  ],
  imports: [
    CommonModule,
    IdeRoutingModule,
    CommonComponentsModule,
    SharedModule,
    FormlyModule.forRoot(),
    FormlyMaterialModule,
    FormlyModule.forRoot({
      types: [
        { name: 'sql', component: FormlySqlComponent },
        { name: 'key-value', component: FormlyKeyValueComponent },
        { name: 'array', component: FormlyArrayComponent },
        { name: 'csharp', component: FormlyCSharpComponent },
        { name: 'hyperlambda', component: FormlyHyperlambdaComponent },
        { name: 'autocomplete', component: FormlyAutocompleteComponent },
        { name: 'autocomplete-textarea', component: FormlyAutocompleteTextareaComponent },
      ],
    }),
  ]
})
export class IdeModule { }
