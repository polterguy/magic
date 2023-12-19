
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Library imports
import { RecaptchaV3Module, RecaptchaModule, RecaptchaFormsModule } from "ng-recaptcha";

// Custom application imports
import { AuthRoutingModule } from './auth.routing.module';
import { LoginComponent } from '../login/login.component';
import { MaterialModule } from 'src/app/modules/material.module';
import { LegalModule } from 'src/app/components/legal/legal.module';

@NgModule({
  declarations: [
    LoginComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    AuthRoutingModule,
    MaterialModule,
    LegalModule,
    FormsModule,
    ReactiveFormsModule,
    RecaptchaModule,
    RecaptchaV3Module,
    RecaptchaFormsModule
  ]
})
export class AuthModule { }
