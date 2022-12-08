import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GeneratedEndpointsComponent } from '../generated-endpoints.component';



const routes: Routes = [
  {
    path: '',
    component: GeneratedEndpointsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GeneratedEndpointsRoutingModule { }
