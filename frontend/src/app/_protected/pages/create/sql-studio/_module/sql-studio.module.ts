
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { CmModule } from 'src/app/codemirror/_module/cm.module';
import { MaterialModule } from 'src/app/material.module';
import { SharedModule } from 'src/app/shared.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { AddFieldComponent } from '../components/add-field-or-key/add-field-or-key.component';
import { ExportDdlComponent } from '../components/export-ddl/export-ddl.component';
import { LinkTableComponent } from '../components/link-table/link-table.component';
import { NewTableComponent } from '../components/new-table/new-table.component';
import { TablesViewComponent } from '../components/tables-view/tables-view.component';
import { SQLStudioComponent } from '../sql-studio.component';
import { SqlViewComponent } from '../components/sql-view/sql-view.component';
import { SqlStudioRoutingModule } from './sql-studio-routing.module';
import { AddMigrateScriptComponent } from '../components/add-migrate-script/add-migrate-script.component';

@NgModule({
  declarations: [
    SQLStudioComponent,
    TablesViewComponent,
    NewTableComponent,
    AddFieldComponent,
    LinkTableComponent,
    ExportDdlComponent,
    SqlViewComponent,
    AddMigrateScriptComponent,
  ],
  imports: [
    CommonModule,
    SqlStudioRoutingModule,
    ComponentsModule,
    MaterialModule,
    CodemirrorModule,
    FormsModule,
    SharedModule,
    CmModule,
  ]
})
export class SqlStudioModule { }
