import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';

import { CoreModule } from '@core';
import { SharedModule } from '@shared';
import { AuthModule } from '@app/auth';
import { HomeModule } from './home/home.module';
import { ShellModule } from './shell/shell.module';
import { AppComponent } from './app.component';
import { MagicSelectorComponent } from './helpers/magic-selector/magic-selector.component';
import { MagicImageComponent } from './helpers/magic-image/magic-image.component';
import { AppRoutingModule } from './app-routing.module';
import { environment } from '@env/environment';
import { JwtModule } from '@auth0/angular-jwt';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { FormatDatePipe } from './pipes/format-date-pipe';

// Generated CRUD components here.
[[imports]]

@NgModule({
  imports: [
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    TranslateModule.forRoot(),
    BrowserAnimationsModule,
    MaterialModule,
    CoreModule,
    SharedModule,
    ShellModule,
    HomeModule,
    AuthModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: () => {
          const persisted = sessionStorage.getItem('credentials') || localStorage.getItem('credentials');
          if (persisted) {
            return JSON.parse(persisted).token;
          }
          return null;
        },
        allowedDomains: [environment.apiDomain],
      },
    }),
    AppRoutingModule, // must be imported as the last module as it contains the fallback route
  ],
  declarations: [
    AppComponent,
    MagicSelectorComponent,
    MagicImageComponent,
    FormatDatePipe,

// Generated CRUD components here.
[[module-declarations]]  ],

  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
