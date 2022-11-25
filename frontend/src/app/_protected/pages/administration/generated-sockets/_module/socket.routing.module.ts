import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneratedSocketsComponent } from '../generated-sockets.component';
import { Routes, RouterModule } from '@angular/router';


const routes: Routes = [
  {
    path: '',
    component: GeneratedSocketsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SocketRoutingModule { }
