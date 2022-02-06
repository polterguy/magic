
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { LOCALE_ID, NgModule } from '@angular/core';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Material imports.
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Other external components.
import { NgxPayPalModule } from 'ngx-paypal';
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

// Application specific normal components.
import { IdeComponent } from './components/tools/ide/ide.component';
import { LogComponent } from './components/analytics/log/diagnostics-log.component';
import { AppComponent } from './components/app/app.component';
import { SqlComponent } from './components/tools/sql/sql.component';
import { AuthComponent } from './components/management/auth/auth.component';
import { HomeComponent } from './components/home/home.component';
import { AboutComponent } from './components/about/about.component';
import { BazarComponent } from './components/management/bazar/bazar.component';
import { TasksComponent } from './components/tools/tasks/tasks.component';
import { FilesComponent } from './components/files/files.component';
import { ConfigComponent } from './components/management/config/config.component';
import { CryptoComponent } from './components/management/crypto/crypto.component';
import { UsersComponent } from './components/management/auth/users/users.component';
import { RolesComponent } from './components/management/auth/roles/roles.component';
import { ProfileComponent } from './components/management/profile/profile.component';
import { InjectDirective } from './components/tools/crudifier/inject.directive';
import { NavbarComponent } from './components/app/navbar/navbar.component';
import { SetupComponent } from './components/management/config/setup/setup.component';
import { TerminalComponent } from './components/tools/terminal/terminal.component';
import { ToolbarComponent } from './components/app/toolbar/toolbar.component';
import { CrudifierComponent } from './components/tools/crudifier/crudifier.component';
import { EndpointsComponent } from './components/analytics/endpoints/endpoints.component';
import { EvaluatorComponent } from './components/tools/evaluator/evaluator.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RegisterComponent } from './components/management/auth/register/register.component';
import { FileEditorComponent } from './components/files/file-editor/file-editor.component';
import { PublicKeysComponent } from './components/management/crypto/public-keys/public-keys.component';
import { SetupAuthComponent } from './components/management/config/setup/setup-auth/setup-auth.component';
import { ConfirmEmailComponent } from './components/management/auth/confirm-email/confirm-email.component';
import { ConfigEditorComponent } from './components/management/config/config-editor/config-editor.component';
import { CrudSqlComponent } from './components/tools/crudifier/crud-sql/crud-sql.component';
import { ChangePasswordComponent } from './components/management/auth/change-password/change-password.component';
import { CodemirrorSqlComponent } from './components/codemirror/codemirror-sql/codemirror-sql.component';
import { DiagnosticsCache } from './components/analytics/cache/cache.component';
import { PublishComponent } from './components/analytics/sockets/publish/publish.component';
import { GenerateCrudAppComponent } from './components/tools/ide/generate-crud-app/generate-crud-app.component';
import { CreateKeypairComponent } from './components/management/config/setup/create-keypair/create-keypair.component';
import { ServerPublicKeyComponent } from './components/management/crypto/server-public-key/server-public-key.component';
import { EndpointDetailsComponent } from './components/analytics/endpoints/endpoint-details/endpoint-details.component';
import { SubscribeComponent } from './components/analytics/sockets/subscribe/subscribe.component';
import { CryptoInvocationsComponent } from './components/management/crypto/crypto-invocations/crypto-invocations.component';
import { CrudifyDatabaseComponent } from './components/management/config/setup/crudify-database/crudify-database.component';
import { CrudBackendComponent } from './components/tools/crudifier/crud-backend/crud-backend.component';
import { CrudFrontendComponent } from './components/tools/crudifier/crud-frontend/crud-frontend.component';
import { HyperlambdaComponent } from './components/codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';
import { SocketsComponent } from './components/analytics/sockets/sockets.component';
import { CrudifierTableComponent } from './components/tools/crudifier/crud-backend/crud-table/crud-table.component';
import { DiagnosticsTestsComponent } from './components/analytics/assumptions/assumptions.component';
import { CrudSqlExtraComponent } from './components/tools/crudifier/crud-sql/crud-sql-extra/crud-sql-extra.component';
import { CrudifierSetDefaultsComponent } from './components/tools/crudifier/crud-backend/set-defaults/crudifier-set-defaults.component';
import { CrudFrontendExtraComponent } from './components/tools/crudifier/crud-frontend/crud-frontend-extra/crud-frontend-extra.component';

// Application specific modal dialog components.
import { ConfirmDialogComponent } from './components/confirm/confirm-dialog.component';
import { LoginDialogComponent } from './components/app/login-dialog/login-dialog.component';
import { LoadSqlDialogComponent } from './components/tools/sql/load-sql-dialog/load-sql-dialog.component';
import { SaveSqlDialogComponent } from './components/tools/sql/save-sql-dialog/save-sql-dialog.component';
import { NewTaskDialogComponent } from './components/tools/tasks/new-task-dialog/new-task-dialog.component';
import { ViewAppDialogComponent } from './components/management/bazar/view-app-dialog/view-app-dialog.component';
import { SubscribeDialogComponent } from './components/management/bazar/subscribe-dialog/subscribe-dialog.component';
import { NewUserDialogComponent } from './components/management/auth/users/new-user-dialog/new-user-dialog.component';
import { NewRoleDialogComponent } from './components/management/auth/roles/new-role-dialog/new-role-dialog.component';
import { RenameFileDialogComponent } from './components/tools/ide/rename-file-dialog/rename-file-dialog.component';
import { JailUserDialogComponent } from './components/management/auth/users/jail-user-dialog/jail-user-dialog.component';
import { ViewReadmeDialogComponent } from './components/management/bazar/view-readme-dialog/view-readme-dialog.component';
import { PreviewFileDialogComponent } from './components/tools/ide/preview-file-dialog/preview-file-dialog.component';
import { SelectMacroDialogComponent } from './components/tools/ide/select-macro-dialog/select-macro-dialog.component';
import { ExecuteMacroDialogComponent } from './components/tools/ide/execute-macro-dialog/execute-macro-dialog.component';
import { AddToRoleDialogComponent } from './components/management/auth/users/add-to-role-dialog/add-to-role-dialog.component';
import { DownloadFileDialogComponent } from './components/files/download-file-dialog/download-file-dialog.component';
import { ScheduleTaskDialogComponent } from './components/tools/tasks/schedule-task-dialog/schedule-task-dialog.component';
import { LoadSnippetDialogComponent } from './components/tools/evaluator/load-snippet-dialog/load-snippet-dialog.component';
import { SaveSnippetDialogComponent } from './components/tools/evaluator/save-snippet-dialog/save-snippet-dialog.component';
import { ToolbarHelpDialogComponent } from './components/app/toolbar/toolbar-help-dialog/toolbar-help-dialog.component';
import { NewFileFolderDialogComponent } from './components/tools/ide/new-file-folder-dialog/new-file-folder-dialog.component';
import { NewFileObjectDialogComponent } from './components/files/new-file-object-dialog/new-file-object-dialog.component';
import { ExecuteEndpointDialogComponent } from './components/tools/ide/execute-endpoint-dialog/execute-endpoint-dialog.component';
import { RenameFileObjectDialogComponent } from './components/files/rename-file-object-dialog/rename-file-object-dialog.component';
import { ViewInstalledAppDialogComponent } from './components/management/bazar/view-installed-app-dialog/view-installed-app-dialog.component';
import { CreateKeypairDialogComponent } from './components/management/crypto/server-public-key/create-keypair-dialog/create-keypair-dialog.component';
import { ImportPublicKeyDialogComponent } from './components/management/crypto/public-keys/import-public-key-dialog/import-public-key-dialog.component';
import { AddQueryParameterDialogComponent } from './components/analytics/endpoints/endpoint-details/add-query-parameter-dialog/add-query-parameter-dialog.component';
import { ConfirmEmailAddressDialogComponent } from './components/management/bazar/view-app-dialog/confirm-email-address-dialog/confirm-email-address-dialog.component';
import { CreateAssumptionTestDialogComponent } from './components/analytics/endpoints/endpoint-details/create-assumption-test-dialog/create-assumption-test-dialog.component';
import { CrudSqlAddArgumentDialogComponent } from './components/tools/crudifier/crud-sql/crud-sql-extra/crud-sql-add-argument-dialog/crud-sql-add-argument-dialog.component';
import { ExecuteTerminalCommandComponent } from './components/tools/ide/execute-terminal-command/execute-terminal-command.component';
import { PieChartComponent } from './components/dashboard/component/pie-chart/pie-chart.component';

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
    SubscribeComponent,
    AddToRoleDialogComponent,
    FileEditorComponent,
    NewFileFolderDialogComponent,
    PreviewFileDialogComponent,
    NewFileObjectDialogComponent,
    ExecuteEndpointDialogComponent,
    RenameFileObjectDialogComponent,
    ServerPublicKeyComponent,
    PublicKeysComponent,
    ImportPublicKeyDialogComponent,
    CreateKeypairDialogComponent,
    CryptoInvocationsComponent,
    ConfigEditorComponent,
    DiagnosticsCache,
    InjectDirective,
    EndpointDetailsComponent,
    AddQueryParameterDialogComponent,
    CreateAssumptionTestDialogComponent,
    DiagnosticsTestsComponent,
    CrudSqlExtraComponent,
    CrudFrontendExtraComponent,
    ChangePasswordComponent,
    ConfirmEmailComponent,
    JailUserDialogComponent,
    RenameFileDialogComponent,
    RegisterComponent,
    CrudifierTableComponent,
    CrudBackendComponent,
    CrudFrontendComponent,
    CrudSqlComponent,
    CrudSqlAddArgumentDialogComponent,
    PublishComponent,
    ToolbarHelpDialogComponent,
    IdeComponent,
    TerminalComponent,
    SocketsComponent,
    BazarComponent,
    SelectMacroDialogComponent,
    ExecuteMacroDialogComponent,
    DownloadFileDialogComponent,
    AboutComponent,
    ViewAppDialogComponent,
    ConfirmEmailAddressDialogComponent,
    ViewReadmeDialogComponent,
    ViewInstalledAppDialogComponent,
    SubscribeDialogComponent,
    ProfileComponent,
    CrudifierSetDefaultsComponent,
    GenerateCrudAppComponent,
    ExecuteTerminalCommandComponent,
    DashboardComponent,
    PieChartComponent,
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
    MatMenuModule,
    MatTabsModule,
    MatCardModule,
    MatTreeModule,
    MatIconModule,
    MatListModule,
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
    MatExpansionModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    NgxPayPalModule,
    ChartsModule,
    CodemirrorModule,
    MatDatepickerModule,
    MatSlideToggleModule,
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
