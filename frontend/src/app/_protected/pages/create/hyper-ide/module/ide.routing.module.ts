
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { IdeComponent } from '../ide.component';

const routes: Routes = [
  {
    path: '',
    component: IdeComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IdeRoutingModule { }
