import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthRoutingModule } from './auth.routing.module';
import { AuthBaseComponent } from '../auth-base/auth-base.component';
import { LoginComponent } from '../login/login.component';
import { ResetPasswordComponent } from '../reset-password/reset-password.component';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';
import { MaterialModule } from 'src/app/material.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RecaptchaV3Module, RecaptchaModule, ReCaptchaV3Service, RecaptchaFormsModule } from "ng-recaptcha";
import { HttpClientModule } from '@angular/common/http';



@NgModule({
  declarations: [
    AuthBaseComponent,
    LoginComponent,
    ResetPasswordComponent,
    ForgotPasswordComponent
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
