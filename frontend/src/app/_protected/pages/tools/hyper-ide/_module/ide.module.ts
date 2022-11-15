import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IdeComponent } from '../ide.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { MaterialModule } from 'src/app/material.module';
import { SharedModule } from 'src/app/shared.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { EndpointDialogComponent } from '../components/endpoint-dialog/endpoint-dialog.component';
import { IdeEditorComponent } from '../ide-editor/ide-editor.component';
import { IdeSearchboxComponent } from '../ide-searchbox/ide-searchbox.component';
import { IdeTreeComponent } from '../ide-tree/ide-tree.component';
import { IdeRoutingModule } from './ide.routing.module';



@NgModule({
  declarations: [
    IdeComponent,
    IdeTreeComponent,
    IdeEditorComponent,
    IdeSearchboxComponent,
    EndpointDialogComponent
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
