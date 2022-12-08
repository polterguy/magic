import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServerKeyComponent } from '../server-key.component';
import { Routes, RouterModule } from '@angular/router';



const routes: Routes = [
  {
    path: '',
    component: ServerKeyComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServerKeyRoutingModule { }
