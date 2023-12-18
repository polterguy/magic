
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigurationComponent } from '../configuration.component';
import { ConfigRoutingModule } from './config.routing.module';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { MaterialModule } from 'src/app/modules/material.module';
import { ComponentsModule } from 'src/app/components/common/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SmtpDialogComponent } from '../components/smtp-dialog/smtp-dialog.component';
import { RecaptchaDialogComponent } from '../components/recaptcha-dialog/recaptcha-dialog.component';

@NgModule({
  declarations: [
    ConfigurationComponent,
    SmtpDialogComponent,
    RecaptchaDialogComponent,
  ],
  imports: [
    CommonModule,
    ConfigRoutingModule,
    ComponentsModule,
    MaterialModule,
    CodemirrorModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class ConfigModule { }
