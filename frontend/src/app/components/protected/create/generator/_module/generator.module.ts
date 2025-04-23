
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/modules/material.module';
import { SharedModule } from 'src/app/modules/shared.module';
import { CommonComponentsModule } from 'src/app/components/protected/common/common-components.module';
import { GeneratorRoutingModule } from './generator.routing.module';
import { GeneratorComponent } from '../generator.component';
import { CRUDGeneratorComponent } from '../crud-generator/crud-generator.component';
import { SqlGeneratorComponent } from '../sql-generator/sql-generator.component';
import { AddArgumentDialogComponent } from '../sql-generator/components/add-argument-dialog/add-argument-dialog.component';
import { SqlSnippetDialogComponent } from '../../sql-studio/components/sql-view/components/load-sql-snippet-dialog/load-sql-snippet-dialog.component';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { SingleTableConfigComponent } from '../crud-generator/components/single-table-config/single-table-config.component';
import { ForeignKeyListComponent } from '../crud-generator/components/foreign-key-list/foreign-key-list.component';
import { OpenAPIGeneratorComponent } from '../open-api-generator/open-api-generator.component';

@NgModule({
  declarations: [
    GeneratorComponent,
    CRUDGeneratorComponent,
    SqlGeneratorComponent,
    OpenAPIGeneratorComponent,
    AddArgumentDialogComponent,
    SqlSnippetDialogComponent,
    SingleTableConfigComponent,
    ForeignKeyListComponent
  ],
  imports: [
    CommonModule,
    GeneratorRoutingModule,
    CommonComponentsModule,
    CodemirrorModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
  ]
})
export class GeneratorModule { }
