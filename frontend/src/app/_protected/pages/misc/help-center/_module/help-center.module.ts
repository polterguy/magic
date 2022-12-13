
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpCenterRoutingModule } from './help-center.routing.module';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule } from '@angular/forms';
import { HelpCenterComponent } from '../help-center.component';

@NgModule({
  declarations: [
    HelpCenterComponent,
  ],
  imports: [
    CommonModule,
    HelpCenterRoutingModule,
    MaterialModule,
    FormsModule,
  ]
})
export class HelpCenterModule { }
