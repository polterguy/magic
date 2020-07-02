 // Common imports from Angular ++.
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Material imports and other library imports.
import { ChartsModule } from 'ng2-charts';
import { JwtModule } from '@auth0/angular-jwt';
import { MatDialogModule } from '@angular/material';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OWL_MOMENT_DATE_TIME_ADAPTER_OPTIONS } from 'ng-pick-datetime-moment';

// Routing, services, etc imports.
import { AppRoutingModule } from './app-routing.module';
import { LoaderService } from './services/loader-service';
import { FormatDatePipe } from './pipes/format-date-pipe';
import { environment } from 'src/environments/environment';
import { AppComponent } from './components/app/app.component';
import { LoaderInterceptor } from './services/loader-interceptor';

// Custom common components.
import { HomeComponent } from './components/home/home.component';
import { AuthComponent } from './components/auth/auth.component';
import { SecurityComponent } from './components/security/security.component';
import { EditUserDialogComponent } from './components/auth/modals/edit-user-dialog';
import { CreateRoleDialogComponent } from './components/auth/modals/create-role-dialog';
import { CreateUserDialogComponent } from './components/auth/modals/create-user-dialog';

// CRUD specific components (scaffolded components).
[[imports]]

// Your main Angular module.
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AuthComponent,
    CreateRoleDialogComponent,
    CreateUserDialogComponent,
    EditUserDialogComponent,
    SecurityComponent,
    FormatDatePipe,
[[module-declarations]]  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: () => localStorage.getItem('jwt_token'),
        whitelistedDomains: [environment.apiDomain],
      }
    }),
    MatButtonModule,
    MatCheckboxModule,
    MatSidenavModule,
    MatTableModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatMomentDateModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    ChartsModule,
  ],
  providers: [
    LoaderService, {
      provide: HTTP_INTERCEPTORS,
      useClass: LoaderInterceptor,
      multi: true
    },
    {
      provide: OWL_MOMENT_DATE_TIME_ADAPTER_OPTIONS,
      useValue: { useUtc: true }
    }
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    CreateRoleDialogComponent,
    CreateUserDialogComponent,
    EditUserDialogComponent,
[[entry-components]]  ]
})
export class AppModule { }
