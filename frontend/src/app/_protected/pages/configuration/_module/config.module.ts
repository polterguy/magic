import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { ConfigEditorComponent } from '../config-editor/config-editor.component';
import { ConfigurationComponent } from '../configuration.component';
import { ConnectionStringDialogComponent } from '../connection-string-dialog/connection-string-dialog.component';
import { CreateKeypairComponent } from '../setup/create-keypair/create-keypair.component';
import { CrudifyDatabaseComponent } from '../setup/crudify-database/crudify-database.component';
import { SetupAuthComponent } from '../setup/setup-auth/setup-auth.component';
import { SetupComponent } from '../setup/setup.component';
import { SmtpDialogComponent } from '../smtp-dialog/smtp-dialog.component';
import { ConfigRoutingModule } from './config-routing.module';

@NgModule({
  declarations: [
    ConfigurationComponent,
    ConfigEditorComponent,
    ConnectionStringDialogComponent,
    SetupComponent,
    SmtpDialogComponent,
    CreateKeypairComponent,
    CrudifyDatabaseComponent,
    SetupAuthComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    ComponentsModule,
    ConfigRoutingModule
  ]
})
export class ConfigModule { }
