import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { GeneratedDatabaseComponent } from '../generated-database.component';



const routes: Routes = [
  {
    path: '',
    component: GeneratedDatabaseComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class GDatabaseRoutingModule { }
