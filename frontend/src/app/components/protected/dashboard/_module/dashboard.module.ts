
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
import { ChartComponent } from '../components/chart/chart.component';
import { SplashComponnt } from '../components/splash/splash.component';
import { LastLogItemsComponent } from '../components/last-log-items/last-log-items.component';
import { MainChartComponent } from '../components/main-chart/main-chart.component';
import { OverviewDialogComponent } from '../components/overview/components/overview-dialog/overview-dialog.component';
import { OverviewComponent } from '../components/overview/overview.component';
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
