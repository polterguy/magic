
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { MaterialModule } from 'src/app/modules/material.module';
import { SharedModule } from 'src/app/modules/shared.module';
import { ComponentsModule } from 'src/app/components/protected/common/components.module';
import { PreviewFileDialogComponent } from '../../../create/hyper-ide/components/preview-file-dialog/preview-file-dialog.component';
import { EndpointsListComponent } from '../endpoints-list/endpoints-list.component';
import { EndpointsResultComponent } from '../endpoints-result/endpoints-result.component';
import { EndpointsComponent } from '../endpoints.component';
import { EndpointsRoutingModule } from './endpoints.routing.module';
import { AssumptionsComponent } from '../components/assumptions/assumptions.component';
import { CreateAssumptionTestDialogComponent } from '../components/create-assumption-test-dialog/create-assumption-test-dialog.component';
import { QueryParamsComponent } from '../components/query-params/query-params.component';

@NgModule({
  declarations: [
    EndpointsComponent,
    EndpointsListComponent,
    EndpointsResultComponent,
    PreviewFileDialogComponent,
    AssumptionsComponent,
    CreateAssumptionTestDialogComponent,
    QueryParamsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    CodemirrorModule,
    ComponentsModule,
    EndpointsRoutingModule,
    SharedModule,
  ]
})
export class EndpointsModule { }
