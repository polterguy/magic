
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TasksComponent } from '../tasks.component';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { MaterialModule } from 'src/app/material.module';
import { TaskRoutingModule } from './task.routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CmModule } from 'src/app/codemirror/_module/cm.module';
import { ScheduleTaskComponent } from '../components/schedule-task/schedule-task.component';
import { NgxMatDatetimePickerModule, NgxMatNativeDateModule } from '@angular-material-components/datetime-picker';
import { ManageTaskComponent } from '../components/manage-task/manage-task.component';

@NgModule({
  declarations: [
    TasksComponent,
    ScheduleTaskComponent,
    ManageTaskComponent
  ],
  imports: [
    CommonModule,
    TaskRoutingModule,
    ComponentsModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CmModule,
    NgxMatDatetimePickerModule,
    NgxMatNativeDateModule
  ]
})
export class TaskModule { }
