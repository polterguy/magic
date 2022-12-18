
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { MaterialModule } from 'src/app/material.module';
import { SharedModule } from 'src/app/shared.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { ChartComponent } from '../components/chart/chart.component';
import { SplashComponnt } from '../components/splash/splash.component';
import { LastLogItemsComponent } from '../components/last-log-items/last-log-items.component';
import { MainChartComponent } from '../components/main-chart/main-chart.component';
import { OverviewDialogComponent } from '../components/overview/components/overview-dialog/overview-dialog.component';
import { OverviewComponent } from '../components/overview/overview.component';
import { ViewLogComponent } from '../components/view-log/view-log.component';
import { DashboardComponent } from '../dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';

@NgModule({
  declarations: [
    DashboardComponent,
    SplashComponnt,
    LastLogItemsComponent,
    MainChartComponent,
    OverviewComponent,
    OverviewDialogComponent,
    ChartComponent,
    ViewLogComponent,
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    MaterialModule,
    FormsModule,
    SharedModule,
    ComponentsModule,
    FormsModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    }),
  ]
})
export class DashboardModule { }
