
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WorkflowEditorComponent } from '../workflow-editor.component';

const routes: Routes = [
  {
    path: '',
    component: WorkflowEditorComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WorkflowEditorRoutingModule { }
