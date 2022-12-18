
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneratedSocketsComponent } from '../sockets.component';
import { SocketRoutingModule } from './socket.routing.module';
import { MaterialModule } from 'src/app/material.module';
import { SocketSearchboxComponent } from '../components/socket-searchbox/socket-searchbox.component';
import { SocketListComponent } from '../socket-list/socket-list.component';
import { SocketResultComponent } from '../socket-result/socket-result.component';
import { SubscribeDialogComponent } from '../components/subscribe-dialog/subscribe-dialog.component';
import { FormsModule } from '@angular/forms';
import { PublishDialogComponent } from '../components/publish-dialog/publish-dialog.component';
import { CmModule } from 'src/app/codemirror/_module/cm.module';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';

@NgModule({
  declarations: [
    GeneratedSocketsComponent,
    SocketSearchboxComponent,
    SocketListComponent,
    SocketResultComponent,
    SubscribeDialogComponent,
    PublishDialogComponent
  ],
  imports: [
    CommonModule,
    SocketRoutingModule,
    MaterialModule,
    FormsModule,
    CmModule,
    CodemirrorModule
  ]
})
export class SocketModule { }
