import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EndpointsComponent } from '../endpoints.component';

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
export class EndpointsRoutingModule { }
