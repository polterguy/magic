import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EndpointsComponent } from '../endpoints.component';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: EndpointsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EndpointRoutingModule { }
