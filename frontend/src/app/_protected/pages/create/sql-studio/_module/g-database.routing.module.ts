
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GeneratedDatabaseComponent } from '../generated-database.component';

const routes: Routes = [
  {
    path: '',
    component: GeneratedDatabaseComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class GDatabaseRoutingModule { }
