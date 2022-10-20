import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneratedEndpointsRoutingModule } from './generated-endpoints.routing.module';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GeneratedEndpointsComponent } from '../generated-endpoints.component';
import { SearchboxComponent } from '../components/searchbox/searchbox.component';
import { EndpointsListComponent } from '../components/endpoints-list/endpoints-list.component';
import { EndpointsResultComponent } from '../components/endpoints-result/endpoints-result.component';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { AssumptionsComponent } from '../components/assumptions/assumptions.component';
import { CreateAssumptionTestDialogComponent } from '../components/create-assumption-test-dialog/create-assumption-test-dialog.component';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { QueryParamsComponent } from '../components/query-params/query-params.component';
import { PreviewFileDialogComponent } from '../../generated-frontend/components/preview-file-dialog/preview-file-dialog.component';
import { SharedModule } from 'src/app/shared.module';



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
