
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/modules/material.module';
import { ComponentsModule } from 'src/app/components/protected/common/components.module';
import { SetupComponent } from '../setup.component';
import { SetupRoutingModule } from './setup.routing.module';

@NgModule({
  declarations: [
    SetupComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    ComponentsModule,
    SetupRoutingModule,
  ]
})
export class SetupModule { }
