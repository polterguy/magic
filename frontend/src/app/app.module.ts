
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Material imports
import { MaterialModule } from './material.module';

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// Extra packages
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { MatNativeDateModule } from '@angular/material/core';
import { RecaptchaV3Module, RecaptchaFormsModule, RecaptchaModule } from "ng-recaptcha";
import { NgxMatDatetimePickerModule, NgxMatTimepickerModule } from '@angular-material-components/datetime-picker';

// Hyperlambda mode for CodeMirror import.
import './codemirror/hyperlambda.js';

// SQL hints plugin for CodeMirror.
import 'codemirror/addon/hint/sql-hint.js';

// PWA
import { environment } from 'src/environments/environment';
import { ServiceWorkerModule } from '@angular/service-worker';

// Interceptors
import { NetworkInterceptor } from './_general/helper/network.interceptor';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { TokenInterceptor } from './_general/helper/token.interceptor';

// Components
import { AppComponent } from './app.component';
import { CoreComponent } from './_layout/core/core.component';
import { HeaderComponent } from './_layout/header/header.component';
import { FooterComponent } from './_layout/footer/footer.component';

import { LoaderInterceptor } from './interceptors/loader.interceptor';
import { AccessGuard } from './access.guard';
import { LoaderService } from './_general/services/loader.service';

@NgModule({
  declarations: [
    AppComponent,
    CoreComponent,
    HeaderComponent,
    FooterComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    CodemirrorModule,
    MatNativeDateModule,
    NgxMatDatetimePickerModule,
    NgxMatTimepickerModule,
    RecaptchaModule,
    RecaptchaV3Module,
    RecaptchaFormsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    AccessGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
