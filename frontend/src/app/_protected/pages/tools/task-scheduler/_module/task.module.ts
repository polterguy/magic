import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskSchedulerComponent } from '../task-scheduler.component';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { MaterialModule } from 'src/app/material.module';
import { TaskRoutingModule } from './task.routing.module';



@NgModule({
  declarations: [
    TaskSchedulerComponent
  ],
  imports: [
    CommonModule,
    TaskRoutingModule,
    ComponentsModule,
    MaterialModule
  ]
})
export class TaskModule { }
