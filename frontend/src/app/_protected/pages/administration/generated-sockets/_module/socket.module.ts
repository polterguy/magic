import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneratedSocketsComponent } from '../generated-sockets.component';
import { SocketRoutingModule } from './socket.routing.module';
import { MaterialModule } from 'src/app/material.module';
import { SocketSearchboxComponent } from '../components/socket-searchbox/socket-searchbox.component';
import { SocketListComponent } from '../socket-list/socket-list.component';
import { SocketResultComponent } from '../socket-result/socket-result.component';
import { SubscribeDialogComponent } from '../components/subscribe-dialog/subscribe-dialog.component';
import { FormsModule } from '@angular/forms';
import { PublishDialogComponent } from '../components/publish-dialog/publish-dialog.component';



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
    FormsModule
  ]
})
export class SocketModule { }
