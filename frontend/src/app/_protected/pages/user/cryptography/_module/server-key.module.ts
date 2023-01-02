
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServerKeyComponent } from '../server-key.component';
import { ServerKeyRoutingModule } from './server-key.routing.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { MaterialModule } from 'src/app/material.module';
import { ServerKeyTableComponent } from '../server-key-table/server-key-table.component';
import { SharedModule } from 'src/app/shared.module';
import { ServerKeyReceiptsComponent } from '../server-key-receipts/server-key-receipts.component';
import { ServerKeyDetailsComponent } from '../components/server-key-details/server-key-details.component';
import { FormsModule } from '@angular/forms';
import { CmModule } from 'src/app/codemirror/_module/cm.module';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { NewServerKeyComponent } from '../components/new-server-key/new-server-key.component';

@NgModule({
  declarations: [
    ServerKeyComponent,
    ServerKeyTableComponent,
    ServerKeyReceiptsComponent,
    ServerKeyDetailsComponent,
    NewServerKeyComponent
  ],
  imports: [
    CommonModule,
    ServerKeyRoutingModule,
    ComponentsModule,
    MaterialModule,
    SharedModule,
    FormsModule,
    CmModule,
    CodemirrorModule
  ]
})
export class ServerKeyModule { }
