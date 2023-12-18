
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthCheckRoutingModule } from './health-check.routing.module';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { MaterialModule } from 'src/app/modules/material.module';
import { ComponentsModule } from 'src/app/components/common/components.module';
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
    CodemirrorModule
  ]
})
export class HealthCheckModule { }
