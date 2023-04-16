
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpCenterRoutingModule } from './help-center.routing.module';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule } from '@angular/forms';
import { HelpCenterComponent } from '../help-center.component';
import { ComponentsModule } from 'src/app/_general/components/components.module';

@NgModule({
  declarations: [
    HelpCenterComponent,
  ],
  imports: [
    CommonModule,
    HelpCenterRoutingModule,
    MaterialModule,
    FormsModule,
    ComponentsModule,
  ]
})
export class HelpCenterModule { }
