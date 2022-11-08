import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
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
