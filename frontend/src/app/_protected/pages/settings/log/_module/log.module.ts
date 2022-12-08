
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogComponent } from '../log.component';
import { LogRoutingModule } from './log.routing.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { MaterialModule } from 'src/app/material.module';
import { LogSearchboxComponent } from '../components/log-searchbox/log-searchbox.component';
import { SharedModule } from 'src/app/shared.module';

@NgModule({
  declarations: [
    LogComponent,
    LogSearchboxComponent
  ],
  imports: [
    CommonModule,
    LogRoutingModule,
    ComponentsModule,
    MaterialModule,
    SharedModule
  ]
})
export class LogModule { }
