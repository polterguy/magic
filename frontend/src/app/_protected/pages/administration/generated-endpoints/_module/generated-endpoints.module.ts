import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { MaterialModule } from 'src/app/material.module';
import { SharedModule } from 'src/app/shared.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { PreviewFileDialogComponent } from '../../generated-frontend/components/preview-file-dialog/preview-file-dialog.component';
import { AssumptionsComponent } from '../components/assumptions/assumptions.component';
import { CreateAssumptionTestDialogComponent } from '../components/create-assumption-test-dialog/create-assumption-test-dialog.component';
import { EndpointsListComponent } from '../endpoints-list/endpoints-list.component';
import { EndpointsResultComponent } from '../endpoints-result/endpoints-result.component';
import { QueryParamsComponent } from '../components/query-params/query-params.component';
import { SearchboxComponent } from '../searchbox/searchbox.component';
import { GeneratedEndpointsComponent } from '../generated-endpoints.component';
import { GeneratedEndpointsRoutingModule } from './generated-endpoints.routing.module';




@NgModule({
  declarations: [
    GeneratedEndpointsComponent,
    SearchboxComponent,
    EndpointsListComponent,
    EndpointsResultComponent,
    AssumptionsComponent,
    CreateAssumptionTestDialogComponent,
    QueryParamsComponent,
    PreviewFileDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    CodemirrorModule,
    ComponentsModule,
    GeneratedEndpointsRoutingModule,
    SharedModule
  ]
})
export class GeneratedEndpointsModule { }
