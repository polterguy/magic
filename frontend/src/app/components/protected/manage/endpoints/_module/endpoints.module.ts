
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { MaterialModule } from 'src/app/modules/material.module';
import { SharedModule } from 'src/app/modules/shared.module';
import { CommonComponentsModule } from 'src/app/components/protected/common/common-components.module';
import { PreviewFileDialogComponent } from '../../../create/hyper-ide/components/preview-file-dialog/preview-file-dialog.component';
import { EndpointsListComponent } from '../endpoints-list/endpoints-list.component';
import { EndpointsResultComponent } from '../endpoints-result/endpoints-result.component';
import { EndpointsComponent } from '../endpoints.component';
import { EndpointsRoutingModule } from './endpoints.routing.module';
import { QueryParamsComponent } from '../components/query-params/query-params.component';

@NgModule({
  declarations: [
    EndpointsComponent,
    EndpointsListComponent,
    EndpointsResultComponent,
    PreviewFileDialogComponent,
    QueryParamsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    CodemirrorModule,
    CommonComponentsModule,
    EndpointsRoutingModule,
    SharedModule,
  ]
})
export class EndpointsModule { }
