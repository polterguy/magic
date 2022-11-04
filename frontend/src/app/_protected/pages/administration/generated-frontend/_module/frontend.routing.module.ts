import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneratedFrontendComponent } from '../generated-frontend.component';
import { Routes, RouterModule } from '@angular/router';



const routes: Routes = [
  {
    path: '',
    component: GeneratedFrontendComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class FrontendRoutingModule { }
