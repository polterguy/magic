
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { MaterialModule } from 'src/app/modules/material.module';
import { SharedModule } from 'src/app/modules/shared.module';
import { CommonComponentsModule } from 'src/app/components/protected/common/common-components.module';
import { DashboardComponent } from '../dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { VibeCodingComponent } from '../components/vibe-coding/vibe-coding.component';

@NgModule({
  declarations: [
    DashboardComponent,
    VibeCodingComponent,
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    MaterialModule,
    FormsModule,
    SharedModule,
    CommonComponentsModule,
    FormsModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    }),
  ]
})
export class DashboardModule { }
