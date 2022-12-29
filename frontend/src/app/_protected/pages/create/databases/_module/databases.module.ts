
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabasesRoutingModule } from './databases.routing.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { MaterialModule } from 'src/app/material.module';
import { DatabasesComponent } from '../databases.component';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared.module';
import { ViewDbComponent } from '../components/view-db/view-db.component';
import { ConnectComponent } from '../connect-databases/connect-databases.component';
import { ManageDatabasesComponent } from '../manage-databases/manage-databases.component';
import { ViewDbListComponent } from '../components/view-db-list/view-db-list.component';
import { CatalogNameComponent } from '../components/catalog-name/catalog-name.component';

@NgModule({
  declarations: [
    DatabasesComponent,
    ManageDatabasesComponent,
    ConnectComponent,
    ViewDbComponent,
    ViewDbListComponent,
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
