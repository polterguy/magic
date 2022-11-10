import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthCheckComponent } from '../health-check.component';
import { HealthCheckRoutingModule } from './health-check.routing.module';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { CmModule } from 'src/app/codemirror/_module/cm.module';
import { MaterialModule } from 'src/app/material.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { HealthSearchboxComponent } from '../components/health-searchbox/health-searchbox.component';
import { TestHealthContentDialogComponent } from '../components/test-health-content-dialog/test-health-content-dialog.component';



@NgModule({
  declarations: [
    HealthCheckComponent,
    TestHealthContentDialogComponent,
    HealthSearchboxComponent
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
