
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MachineLearningComponent } from '../machine-learning.component';

const routes: Routes = [
  {
    path: '',
    component: MachineLearningComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MachineLearningTrainingRoutingModule { }
