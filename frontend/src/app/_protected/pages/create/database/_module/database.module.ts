
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseRoutingModule } from './database.routing.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { MaterialModule } from 'src/app/material.module';
import { DatabaseComponent } from '../database.component';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared.module';
import { ViewDbComponent } from '../components/view-db/view-db.component';
import { ConnectComponent } from '../connect/connect.component';
import { AddNewDatabaseComponent } from '../add-new-database/add-new-database.component';
import { ViewDbListComponent } from '../components/view-db-list/view-db-list.component';
import { CatalogNameComponent } from '../components/catalog-name/catalog-name.component';

@NgModule({
  declarations: [
    DatabaseComponent,
    AddNewDatabaseComponent,
    ConnectComponent,
    ViewDbComponent,
    ViewDbListComponent,
    CatalogNameComponent
  ],
  imports: [
    CommonModule,
    DatabaseRoutingModule,
    ComponentsModule,
    MaterialModule,
    FormsModule,
    SharedModule
  ]
})
export class DatabaseModule { }
