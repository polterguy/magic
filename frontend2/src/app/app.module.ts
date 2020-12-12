
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Material imports.
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Other external components.
import { CodemirrorModule } from '@ctrl/ngx-codemirror';

// Hyperlambda mode for CodeMirror.
import './codemirror/hyperlambda.js';

// Application specific imports.
import { MarkedPipe } from './pipes/marked.pipe';
import { DateToPipe } from './pipes/date-to.pipe';
import { DateFromPipe } from './pipes/date-from.pipe';
import { AppRoutingModule } from './app-routing.module';
import { LoaderService } from './services/loader.service';
import { AuthInterceptor } from './services/interceptors/auth.interceptor';
import { LoaderInterceptor } from './services/interceptors/loader.interceptor';

// Reusable application specific components.
import { HyperlambdaComponent } from './components/codemirror/hyperlambda/hyperlambda.component';

// Application specific components.
import { LogComponent } from './components/log/log.component';
import { AppComponent } from './components/app/app.component';
import { SqlComponent } from './components/sql/sql.component';
import { AuthComponent } from './components/auth/auth.component';
import { HomeComponent } from './components/home/home.component';
import { TasksComponent } from './components/tasks/tasks.component';
import { FilesComponent } from './components/files/files.component';
import { ConfigComponent } from './components/config/config.component';
import { CryptoComponent } from './components/crypto/crypto.component';
import { NavbarComponent } from './components/app/navbar/navbar.component';
import { SetupComponent } from './components/config/setup/setup.component';
import { ToolbarComponent } from './components/app/toolbar/toolbar.component';
import { CrudifierComponent } from './components/crudifier/crudifier.component';
import { EndpointsComponent } from './components/endpoints/endpoints.component';
import { EvaluatorComponent } from './components/evaluator/evaluator.component';
import { SetupCryptoComponent } from './components/config/setup/setup-crypto/setup-crypto.component';
import { SetupDatabaseComponent } from './components/config/setup/setup-database/setup-database.component';
import { SetupConfigurationComponent } from './components/config/setup/setup-configuration/setup-configuration.component';

// Modal dialogs.
import { LoginDialogComponent } from './components/app/login-dialog/login-dialog.component';
import { LoadSnippetDialogComponent } from './components/evaluator/load-snippet-dialog/load-snippet-dialog.component';
import { SaveSnippetDialogComponent } from './components/evaluator/save-snippet-dialog/save-snippet-dialog.component';
import { UsersComponent } from './components/auth/users/users.component';
import { RolesComponent } from './components/auth/roles/roles.component';
import { NewUserDialogComponent } from './components/auth/users/new-user-dialog/new-user-dialog.component';

/**
 * The main module for your Magic Dashboard application.
 */
@NgModule({
  declarations: [
    AppComponent,
    SqlComponent,
    HomeComponent,
    LoginDialogComponent,
    LoadSnippetDialogComponent,
    SaveSnippetDialogComponent,
    CrudifierComponent,
    EndpointsComponent,
    TasksComponent,
    FilesComponent,
    EvaluatorComponent,
    AuthComponent,
    LogComponent,
    CryptoComponent,
    MarkedPipe,
    DateToPipe,
    DateFromPipe,
    ConfigComponent,
    NavbarComponent,
    ToolbarComponent,
    SetupComponent,
    SetupConfigurationComponent,
    SetupDatabaseComponent,
    SetupCryptoComponent,
    HyperlambdaComponent,
    UsersComponent,
    RolesComponent,
    NewUserDialogComponent,
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatSidenavModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatCardModule,
    MatIconModule,
    MatToolbarModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatInputModule,
    MatTableModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    CodemirrorModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    LoaderService, {
      provide: HTTP_INTERCEPTORS,
      useClass: LoaderInterceptor,
      multi: true
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
