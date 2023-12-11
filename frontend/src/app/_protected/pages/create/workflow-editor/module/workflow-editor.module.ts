
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowEditorRoutingModule } from './workflow-editor.routing.module';
import { MaterialModule } from 'src/app/material.module';
import { CmModule } from 'src/app/codemirror/_module/cm.module';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { WorkflowEditorComponent } from '../workflow-editor.component';

@NgModule({
  declarations: [
    WorkflowEditorComponent,
  ],
  imports: [
    CommonModule,
    WorkflowEditorRoutingModule,
    MaterialModule,
    CmModule,
    CodemirrorModule,
  ]
})
export class WorkflowEditorModule { }
