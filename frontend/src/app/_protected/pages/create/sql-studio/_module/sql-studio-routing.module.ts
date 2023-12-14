
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SQLStudioComponent } from '../sql-studio.component';

const routes: Routes = [
  {
    path: '',
    component: SQLStudioComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class SqlStudioRoutingModule { }
