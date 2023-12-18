
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/modules/material.module';
import { SharedModule } from 'src/app/modules/shared.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { EndpointRoutingModule } from './endpoint.routing.module';
import { EndpointGeneratorComponent } from '../endpoint-generator.component';
import { AutoGeneratorComponent } from '../auto-endpoint-generator/auto-endpoint-generator.component';
import { ManualGeneratorComponent } from '../sql-endpoint-generator/sql-endpoint-generator.component';
import { AddArgumentDialogComponent } from '../sql-endpoint-generator/components/add-argument-dialog/add-argument-dialog.component';
import { SqlSnippetDialogComponent } from '../../sql-studio/components/sql-view/components/load-sql-snippet-dialog/load-sql-snippet-dialog.component';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { SingleTableConfigComponent } from '../auto-endpoint-generator/components/single-table-config/single-table-config.component';
import { CmModule } from 'src/app/codemirror/_module/cm.module';
import { ForeignKeyListComponent } from '../auto-endpoint-generator/components/foreign-key-list/foreign-key-list.component';

@NgModule({
  declarations: [
    EndpointGeneratorComponent,
    AutoGeneratorComponent,
    ManualGeneratorComponent,
    AddArgumentDialogComponent,
    SqlSnippetDialogComponent,
    SingleTableConfigComponent,
    ForeignKeyListComponent
  ],
  imports: [
    CommonModule,
    EndpointRoutingModule,
    ComponentsModule,
    CodemirrorModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    CmModule
  ]
})
export class EndpointModule { }
