
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { MaterialModule } from 'src/app/modules/material.module';
import { SharedModule } from 'src/app/modules/shared.module';
import { CommonComponentsModule } from 'src/app/components/protected/common/common-components.module';
import { AddFieldComponent } from '../components/tables-view/components/add-field-or-key/add-field-or-key.component';
import { ExportDdlComponent } from '../components/tables-view/components/export-ddl/export-ddl.component';
import { LinkTableComponent } from '../components/tables-view/components/add-link-table/add-link-table.component';
import { NewTableComponent } from '../components/tables-view/components/add-table/add-table.component';
import { TablesViewComponent } from '../components/tables-view/tables-view.component';
import { SQLStudioComponent } from '../sql-studio.component';
import { SqlViewComponent } from '../components/sql-view/sql-view.component';
import { SqlStudioRoutingModule } from './sql-studio-routing.module';
import { AddMigrateScriptComponent } from '../components/tables-view/components/apply-migrate-script/apply-migrate-script.component';

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
    CommonComponentsModule,
    MaterialModule,
    CodemirrorModule,
    FormsModule,
    SharedModule,
  ]
})
export class SqlStudioModule { }
