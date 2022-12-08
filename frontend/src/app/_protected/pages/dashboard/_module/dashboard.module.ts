
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgxEchartsModule } from 'ngx-echarts';
import { MaterialModule } from 'src/app/material.module';
import { SharedModule } from 'src/app/shared.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { ChartComponent } from '../components/chart/chart.component';
import { InfoPanelComponent } from '../components/info-panel/info-panel.component';
import { LastLogItemsComponent } from '../components/last-log-items/last-log-items.component';
import { MainChartComponent } from '../components/main-chart/main-chart.component';
import { OverviewComponent } from '../components/overview/overview.component';
import { ViewLogComponent } from '../components/view-log/view-log.component';
import { DashboardComponent } from '../dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    DashboardComponent,
    InfoPanelComponent,
    LastLogItemsComponent,
    MainChartComponent,
    OverviewComponent,
    ChartComponent,
    ViewLogComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    MaterialModule,
    SharedModule,
    ComponentsModule,
    FormsModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    }),
  ]
})
export class DashboardModule { }
