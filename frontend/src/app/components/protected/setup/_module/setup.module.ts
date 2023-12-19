
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/modules/material.module';
import { CommonComponentsModule } from 'src/app/components/protected/common/common-components.module';
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
    CommonComponentsModule,
    SetupRoutingModule,
  ]
})
export class SetupModule { }
