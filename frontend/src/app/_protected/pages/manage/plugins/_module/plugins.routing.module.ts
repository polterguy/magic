
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { PluginsComponent } from '../plugins.component';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: PluginsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PluginsRoutingModule { }
