import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FrontendGeneratorComponent } from '../frontend-generator.component';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: FrontendGeneratorComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FrontendGeneratorRoutingModule { }
