import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogComponent } from '../log.component';
import { LogRoutingModule } from './log.routing.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { MaterialModule } from 'src/app/material.module';
import { LogSearchboxComponent } from '../components/log-searchbox/log-searchbox.component';
import { LogExceptionComponent } from '../components/log-exception/log-exception.component';
import { SharedModule } from 'src/app/shared.module';



@NgModule({
  declarations: [
    LogComponent,
    LogSearchboxComponent,
    LogExceptionComponent
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
