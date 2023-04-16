
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { MaterialModule } from 'src/app/material.module';
import { SharedModule } from 'src/app/shared.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { PreviewFileDialogComponent } from '../../../create/hyper-ide/components/preview-file-dialog/preview-file-dialog.component';
import { EndpointsListComponent } from '../endpoints-list/endpoints-list.component';
import { EndpointsResultComponent } from '../endpoints-result/endpoints-result.component';
import { EndpointsComponent } from '../endpoints.component';
import { EndpointsRoutingModule } from './endpoints.routing.module';

@NgModule({
  declarations: [
    EndpointsComponent,
    EndpointsListComponent,
    EndpointsResultComponent,
    PreviewFileDialogComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    CodemirrorModule,
    ComponentsModule,
    EndpointsRoutingModule,
    SharedModule
  ]
})
export class EndpointsModule { }
