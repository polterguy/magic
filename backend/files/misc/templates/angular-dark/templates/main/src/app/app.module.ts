 // Common imports from Angular ++.
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Material imports and other library imports.
import { ChartsModule } from 'ng2-charts';
import { JwtModule } from '@auth0/angular-jwt';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';

// Application specifics Routing, services, etc, type of imports.
import { AppRoutingModule } from './app-routing.module';
import { LoaderService } from './services/loader-service';
import { FormatDatePipe } from './pipes/format-date-pipe';
import { environment } from 'src/environments/environment';
import { AppComponent } from './components/app/app.component';
import { LoaderInterceptor } from './services/loader-interceptor';

// Custom common components.
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/app/modals/login.component';
import { SelectorComponent } from './helpers/selector/selector.component';

// Generated CRUD components here.
[[imports]]

// Your main Angular module.
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    FormatDatePipe,
    SelectorComponent,

// Generated CRUD components here.
[[module-declarations]]  ],
  imports: [
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: () => localStorage.getItem('jwt_token'),
        whitelistedDomains: [environment.apiDomain],
      }
    }),
    ChartsModule,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatTableModule,
    MatButtonModule,
    MatToolbarModule,
    MatSelectModule,
    MatDialogModule,
    MatSidenavModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatProgressSpinnerModule,
  ],
  providers: [
    LoaderService, {
      provide: HTTP_INTERCEPTORS,
      useClass: LoaderInterceptor,
      multi: true
    },
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    LoginComponent,

// Generated edit/create modal dialogues here.
[[entry-components]]  ]
})
export class AppModule { }
