
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TasksComponent } from '../tasks.component';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { MaterialModule } from 'src/app/material.module';
import { TaskRoutingModule } from './task.routing.module';
import { TaskSearchboxComponent } from '../task-searchbox/task-searchbox.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CmModule } from 'src/app/codemirror/_module/cm.module';
import { ScheduleTaskComponent } from '../components/schedule-task/schedule-task.component';
import { NgxMatDatetimePickerModule, NgxMatNativeDateModule } from '@angular-material-components/datetime-picker';
import { ManageTaskComponent } from '../components/manage-task/manage-task.component';

@NgModule({
  declarations: [
    TasksComponent,
    TaskSearchboxComponent,
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
