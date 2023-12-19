
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogComponent } from '../log.component';
import { LogRoutingModule } from './log.routing.module';
import { ComponentsModule } from 'src/app/components/protected/common/components.module';
import { MaterialModule } from 'src/app/modules/material.module';
import { SharedModule } from 'src/app/modules/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    LogComponent,
  ],
  imports: [
    CommonModule,
    LogRoutingModule,
    ComponentsModule,
    MaterialModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class LogModule { }
