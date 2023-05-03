
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthCheckRoutingModule } from './health-check.routing.module';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { CmModule } from 'src/app/codemirror/_module/cm.module';
import { MaterialModule } from 'src/app/material.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { TestHealthContentDialogComponent } from '../components/test-health-content-dialog/test-health-content-dialog.component';
import { HealthCheckComponent } from '../health-check.component';

@NgModule({
  declarations: [
    HealthCheckComponent,
    TestHealthContentDialogComponent,
  ],
  imports: [
    CommonModule,
    HealthCheckRoutingModule,
    ComponentsModule,
    MaterialModule,
    CmModule,
    CodemirrorModule
  ]
})
export class HealthCheckModule { }
