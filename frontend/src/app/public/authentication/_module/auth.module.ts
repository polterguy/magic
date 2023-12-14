
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthRoutingModule } from './auth.routing.module';
import { LoginComponent } from '../login/login.component';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';
import { MaterialModule } from 'src/app/material.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RecaptchaV3Module, RecaptchaModule, RecaptchaFormsModule } from "ng-recaptcha";
import { HttpClientModule } from '@angular/common/http';
import { AutoAuthComponent } from '../auto-auth/auto-auth.component';

@NgModule({
  declarations: [
    LoginComponent,
    ForgotPasswordComponent,
    AutoAuthComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    AuthRoutingModule,
    MaterialModule,
    ComponentsModule,
    FormsModule,
    ReactiveFormsModule,
    RecaptchaModule,
    RecaptchaV3Module,
    RecaptchaFormsModule
  ]
})
export class AuthModule { }
