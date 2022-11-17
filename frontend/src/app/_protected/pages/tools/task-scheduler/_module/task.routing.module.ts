import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskSchedulerComponent } from '../task-scheduler.component';
import { Routes, RouterModule } from '@angular/router';



const routes: Routes = [
  {
    path: '',
    component: TaskSchedulerComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TaskRoutingModule { }
