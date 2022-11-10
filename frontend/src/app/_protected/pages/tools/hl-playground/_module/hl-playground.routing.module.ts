import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlPlaygroundComponent } from '../hl-playground.component';
import { Routes, RouterModule } from '@angular/router';


const routes: Routes = [
  {
    path: '',
    component: HlPlaygroundComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HlPlaygroundRoutingModule { }
