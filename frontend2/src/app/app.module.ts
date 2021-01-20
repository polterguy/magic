
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { NgModule } from '@angular/core';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Material imports.
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material/core';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Other external components.
import { ChartsModule } from 'ng2-charts';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import {
  NgxMatDatetimePickerModule,
  NgxMatNativeDateModule,
  NgxMatTimepickerModule
} from '@angular-material-components/datetime-picker';

// Hyperlambda mode for CodeMirror import.
import './codemirror/hyperlambda.js';

// SQL hints plugin for CodeMirror.
import 'codemirror/addon/hint/sql-hint.js';

// Application specific imports.
import { DatePipe } from './pipes/date.pipe';
import { MarkedPipe } from './pipes/marked.pipe';
import { DynamicPipe } from './pipes/dynamic.pipe';
import { DateFromPipe } from './pipes/date-from.pipe';
import { DateSincePipe } from './pipes/date-since.pipe';
import { AppRoutingModule } from './app-routing.module';
import { AuthInterceptor } from './services/auth.interceptor';
import { LoaderService } from './components/app/services/loader.service';
import { LoaderInterceptor } from './components/app/services/loader.interceptor';

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
import { UsersComponent } from './components/auth/users/users.component';
import { RolesComponent } from './components/auth/roles/roles.component';
import { NavbarComponent } from './components/app/navbar/navbar.component';
import { SetupComponent } from './components/config/setup/setup.component';
import { ToolbarComponent } from './components/app/toolbar/toolbar.component';
import { CrudifierComponent } from './components/crudifier/crudifier.component';
import { EndpointsComponent } from './components/endpoints/endpoints.component';
import { EvaluatorComponent } from './components/evaluator/evaluator.component';
import { LicenseComponent } from './components/config/license/license.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DiagnosticsComponent } from './components/diagnostics/diagnostics.component';
import { FileEditorComponent } from './components/files/file-editor/file-editor.component';
import { PublicKeysComponent } from './components/crypto/public-keys/public-keys.component';
import { SetupAuthComponent } from './components/config/setup/setup-auth/setup-auth.component';
import { ConfirmEmailComponent } from './components/auth/confirm-email/confirm-email.component';
import { ConfigEditorComponent } from './components/config/config-editor/config-editor.component';
import { ChangePasswordComponent } from './components/auth/change-password/change-password.component';
import { CodemirrorSqlComponent } from './components/codemirror/codemirror-sql/codemirror-sql.component';
import { DiagnosticsCache } from './components/diagnostics/diagnostics-cache/diagnostics-cache.component';
import { CreateKeypairComponent } from './components/config/setup/create-keypair/create-keypair.component';
import { ServerPublicKeyComponent } from './components/crypto/server-public-key/server-public-key.component';
import { EndpointDetailsComponent } from './components/endpoints/endpoint-details/endpoint-details.component';
import { CryptoInvocationsComponent } from './components/crypto/crypto-invocations/crypto-invocations.component';
import { CrudifyDatabaseComponent } from './components/config/setup/crudify-database/crudify-database.component';
import { DiagnosticsErrorsComponent } from './components/diagnostics/diagnostics-errors/diagnostics-errors.component';
import { HyperlambdaComponent } from './components/codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';
import { DiagnosticsOverviewComponent } from './components/diagnostics/diagnostics-overview/diagnostics-overview.component';
import { DiagnosticsSecurityComponent } from './components/diagnostics/diagnostics-security/diagnostics-security.component';
import { DiagnosticsTestsComponent } from './components/diagnostics/diagnostics-assumptions/diagnostics-assumptions.component';

// Modal dialogs.
import { ConfirmDialogComponent } from './components/confirm/confirm-dialog.component';
import { LoginDialogComponent } from './components/app/login-dialog/login-dialog.component';
import { LoadSqlDialogComponent } from './components/sql/load-sql-dialog/load-sql-dialog.component';
import { SaveSqlDialogComponent } from './components/sql/save-sql-dialog/save-sql-dialog.component';
import { NewTaskDialogComponent } from './components/tasks/new-task-dialog/new-task-dialog.component';
import { NewUserDialogComponent } from './components/auth/users/new-user-dialog/new-user-dialog.component';
import { NewRoleDialogComponent } from './components/auth/roles/new-role-dialog/new-role-dialog.component';
import { JailUserDialogComponent } from './components/auth/users/jail-user-dialog/jail-user-dialog.component';
import { ScheduleTaskDialogComponent } from './components/tasks/schedule-task-dialog/schedule-task-dialog.component';
import { LoadSnippetDialogComponent } from './components/evaluator/load-snippet-dialog/load-snippet-dialog.component';
import { SaveSnippetDialogComponent } from './components/evaluator/save-snippet-dialog/save-snippet-dialog.component';
import { NewFileObjectDialogComponent } from './components/files/new-file-object-dialog/new-file-object-dialog.component';
import { CreateKeypairDialogComponent } from './components/crypto/server-public-key/create-keypair-dialog/create-keypair-dialog.component';
import { ImportPublicKeyDialogComponent } from './components/crypto/public-keys/import-public-key-dialog/import-public-key-dialog.component';
import { AddQueryParameterDialogComponent } from './components/endpoints/endpoint-details/add-query-parameter-dialog/add-query-parameter-dialog.component';
import { CreateAssumptionTestDialogComponent } from './components/endpoints/endpoint-details/create-assumption-test-dialog/create-assumption-test-dialog.component';

/**
 * The main module for your Magic Dashboard application.
 */
@NgModule({
  declarations: [
    AppComponent,
    SqlComponent,
    HomeComponent,
    LoginDialogComponent,
    LoadSqlDialogComponent,
    SaveSqlDialogComponent,
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
    DateSincePipe,
    DynamicPipe,
    DatePipe,
    DateFromPipe,
    ConfigComponent,
    NavbarComponent,
    ToolbarComponent,
    SetupComponent,
    SetupAuthComponent,
    CrudifyDatabaseComponent,
    CreateKeypairComponent,
    CodemirrorSqlComponent,
    HyperlambdaComponent,
    UsersComponent,
    RolesComponent,
    NewUserDialogComponent,
    ConfirmDialogComponent,
    NewRoleDialogComponent,
    ScheduleTaskDialogComponent,
    NewTaskDialogComponent,
    FileEditorComponent,
    NewFileObjectDialogComponent,
    ServerPublicKeyComponent,
    PublicKeysComponent,
    ImportPublicKeyDialogComponent,
    CreateKeypairDialogComponent,
    CryptoInvocationsComponent,
    ConfigEditorComponent,
    DiagnosticsSecurityComponent,
    LicenseComponent,
    DiagnosticsOverviewComponent,
    DiagnosticsComponent,
    DiagnosticsErrorsComponent,
    DiagnosticsCache,
    EndpointDetailsComponent,
    AddQueryParameterDialogComponent,
    CreateAssumptionTestDialogComponent,
    DiagnosticsTestsComponent,
    ChangePasswordComponent,
    ConfirmEmailComponent,
    JailUserDialogComponent,
    RegisterComponent,
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserModule,
    ClipboardModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatSidenavModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTabsModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatDialogModule,
    MatStepperModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatInputModule,
    MatTableModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    ChartsModule,
    CodemirrorModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgxMatDatetimePickerModule,
    NgxMatTimepickerModule,
    NgxMatNativeDateModule,
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
export class AppModule {
}
