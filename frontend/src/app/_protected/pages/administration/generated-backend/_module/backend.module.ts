import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { MaterialModule } from 'src/app/material.module';
import { SharedModule } from 'src/app/shared.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { BackendEditorComponent } from '../backend-editor/backend-editor.component';
import { BackendSearchboxComponent } from '../backend-searchbox/backend-searchbox.component';
import { BackendTreeComponent } from '../backend-tree/backend-tree.component';
import { EndpointDialogComponent } from '../../../tools/hyper-ide/components/endpoint-dialog/endpoint-dialog.component';
import { GeneratedBackendComponent } from '../generated-backend.component';
import { BackendRoutingModule } from './backend.routing.module';




@NgModule({
  declarations: [
    GeneratedBackendComponent,
    BackendTreeComponent,
    BackendEditorComponent,
    BackendSearchboxComponent,
    EndpointDialogComponent
  ],
  imports: [
    CommonModule,
    BackendRoutingModule,
    ComponentsModule,
    MaterialModule,
    CodemirrorModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ]
})
export class BackendModule { }
