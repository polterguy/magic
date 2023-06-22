
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabasesRoutingModule } from './databases.routing.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { MaterialModule } from 'src/app/material.module';
import { DatabasesComponent } from '../databases.component';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared.module';
import { ViewPluginDatabaseComponent } from '../manage-databases/components/view-plugin-database/view-plugin-database.component';
import { ConnectComponent } from '../connect-databases/connect-databases.component';
import { ManageDatabasesComponent } from '../manage-databases/manage-databases.component';
import { ManageCatalogsComponent } from '../connect-databases/components/manage-catalogs/manage-catalogs.component';
import { CatalogNameComponent } from '../connect-databases/components/catalog-name/catalog-name.component';

@NgModule({
  declarations: [
    DatabasesComponent,
    ManageDatabasesComponent,
    ConnectComponent,
    ViewPluginDatabaseComponent,
    ManageCatalogsComponent,
    CatalogNameComponent
  ],
  imports: [
    CommonModule,
    DatabasesRoutingModule,
    ComponentsModule,
    MaterialModule,
    FormsModule,
    SharedModule
  ]
})
export class DatabasesModule { }
