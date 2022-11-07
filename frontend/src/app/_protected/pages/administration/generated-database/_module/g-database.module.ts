import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { CmModule } from 'src/app/codemirror/_module/cm.module';
import { MaterialModule } from 'src/app/material.module';
import { SharedModule } from 'src/app/shared.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { AddFieldComponent } from '../components/add-field/add-field.component';
import { ExportDdlComponent } from '../components/export-ddl/export-ddl.component';
import { LinkTableComponent } from '../components/link-table/link-table.component';
import { NewTableComponent } from '../components/new-table/new-table.component';
import { SnippetNameDialogComponent } from '../components/snippet-name-dialog/snippet-name-dialog.component';
import { TablesViewComponent } from '../components/tables-view/tables-view.component';
import { GeneratedDatabaseComponent } from '../generated-database.component';
import { SqlViewComponent } from '../sql-view/sql-view.component';
import { GDatabaseRoutingModule } from './g-database.routing.module';

@NgModule({
  declarations: [
    GeneratedDatabaseComponent,
    TablesViewComponent,
    NewTableComponent,
    AddFieldComponent,
    LinkTableComponent,
    ExportDdlComponent,
    SqlViewComponent,
    SnippetNameDialogComponent
  ],
  imports: [
    CommonModule,
    GDatabaseRoutingModule,
    ComponentsModule,
    MaterialModule,
    CodemirrorModule,
    FormsModule,
    SharedModule,
    CmModule
  ]
})
export class GDatabaseModule { }
