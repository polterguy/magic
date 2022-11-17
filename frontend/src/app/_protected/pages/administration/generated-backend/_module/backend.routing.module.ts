import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { GeneratedBackendComponent } from '../generated-backend.component';



const routes: Routes = [
  {
    path: '',
    component: GeneratedBackendComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class BackendRoutingModule { }
