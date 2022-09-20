import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';
import { NgxImageCompressService } from 'ngx-image-compress';
import { A11yModule } from '@angular/cdk/a11y';

import { CoreModule } from '@core';
import { SharedModule } from '@shared';
import { AuthModule } from '@app/auth';
import { HomeModule } from './home/home.module';
import { ShellModule } from './shell/shell.module';
import { AppComponent } from './app.component';
import { MagicSelectorComponent } from './helpers/magic-selector/magic-selector.component';
import { MagicAutocompleteComponent } from './helpers/magic-autocomplete/magic-autocomplete.component';
import { MagicFilterComponent } from './helpers/magic-filter/magic-filter.component';
import { MagicImageComponent } from './helpers/magic-image/magic-image.component';
import { MagicImageFieldComponent } from './helpers/magic-image-field/magic-image-field.component';
import { MagicImageViewComponent } from './helpers/magic-image-view/magic-image-view.component';
import { MagicFileViewComponent } from './helpers/magic-file-view/magic-file-view.component';
import { MagicFileComponent } from './helpers/magic-file/magic-file.component';
import { MagicFileFieldComponent } from './helpers/magic-file-field/magic-file-field.component';
import { AppRoutingModule } from './app-routing.module';
import { environment } from '@env/environment';
import { JwtModule } from '@auth0/angular-jwt';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { FormatDatePipe } from './pipes/format-date-pipe';
import { DateSincePipe } from './pipes/date-since.pipe';
import { ConfirmDialogComponent } from './confirm-deletion-dialog/confirm-dialog.component';
import { UserManagementComponent } from './common/user-management/user-management.component';
import { EditUserDialogComponent } from './common/user-management/edit-user-dialog/edit-user-dialog.component';
import { CreateUserDialogComponent } from './common/user-management/create-user-dialog/create-user-dialog.component';
import { EditExtraFieldsComponent } from './common/user-management/edit-extra-fields/edit-extra-fields.component';

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
    A11yModule
  ],
  declarations: [
    AppComponent,
    MagicSelectorComponent,
    MagicAutocompleteComponent,
    MagicFilterComponent,
    MagicImageComponent,
    MagicImageFieldComponent,
    MagicImageViewComponent,
    MagicFileViewComponent,
    MagicFileComponent,
    MagicFileFieldComponent,
    FormatDatePipe,
    DateSincePipe,
    ConfirmDialogComponent,
    UserManagementComponent,
    EditUserDialogComponent,
    CreateUserDialogComponent,
    EditExtraFieldsComponent,

    // Generated CRUD components here.
[[module-declarations]]  ],

  providers: [NgxImageCompressService],
  bootstrap: [AppComponent],
})
export class AppModule {}
