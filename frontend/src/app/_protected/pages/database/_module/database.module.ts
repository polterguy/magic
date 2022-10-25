import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseRoutingModule } from './database.routing.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { MaterialModule } from 'src/app/material.module';
import { DatabaseComponent } from '../database.component';
import { AddNewDatabaseComponent } from '../add-new-database/add-new-database.component';
import { ConnectComponent } from '../connect/connect.component';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared.module';
import { ViewDbComponent } from '../components/view-db/view-db.component';



@NgModule({
  declarations: [
    DatabaseComponent,
    AddNewDatabaseComponent,
    ConnectComponent,
    ViewDbComponent
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
