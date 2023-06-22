
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { CmModule } from 'src/app/codemirror/_module/cm.module';
import { MaterialModule } from 'src/app/material.module';
import { SharedModule } from 'src/app/shared.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
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
    ComponentsModule,
    MaterialModule,
    CodemirrorModule,
    FormsModule,
    SharedModule,
    CmModule,
  ]
})
export class SqlStudioModule { }
