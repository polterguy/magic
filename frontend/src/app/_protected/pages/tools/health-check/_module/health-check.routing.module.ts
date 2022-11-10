import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthCheckComponent } from '../health-check.component';
import { RouterModule, Routes } from '@angular/router';


const routes: Routes = [
  {
    path: '',
    component: HealthCheckComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HealthCheckRoutingModule { }
