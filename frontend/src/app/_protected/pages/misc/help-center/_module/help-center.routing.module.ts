
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HelpCenterComponent } from '../help-center.component';

const routes: Routes = [
  {
    path: '',
    component: HelpCenterComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HelpCenterRoutingModule { }
