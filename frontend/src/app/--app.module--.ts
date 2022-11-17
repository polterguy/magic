
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { NgModule } from '@angular/core';
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
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
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
import { NgxEchartsModule } from 'ngx-echarts';

// reCAPTCHA v3
import { RecaptchaModule, RecaptchaFormsModule, RecaptchaV3Module } from "ng-recaptcha";

// Hyperlambda mode for CodeMirror import.
import './codemirror/hyperlambda.js';

// SQL hints plugin for CodeMirror.
import 'codemirror/addon/hint/sql-hint.js';

// Application specific imports.
import { AccessGuard } from './access.guard';
import { DatePipe } from './_general/pipes/date.pipe';
import { MarkedPipe } from './_general/pipes/marked.pipe';
import { DynamicPipe } from './_general/pipes/dynamic.pipe';
import { DateFromPipe } from './_general/pipes/date-from.pipe';
import { DateSincePipe } from './_general/pipes/date-since.pipe';
import { AppRoutingModule } from './app-routing.module';
import { LoaderService } from './services/loader.service';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { LoaderInterceptor } from './interceptors/loader.interceptor';
import { InjectDirective } from './components/tools/crudifier/inject.directive';

// Application specific normal components.
import { MainComponent } from './components/main/main.component';
import { IdeComponent } from './components/tools/ide/ide.component';
import { SqlComponent } from './components/tools/sql/sql.component';
import { AboutComponent } from './components/about/about.component';
import { LogComponent } from './components/misc/log/log.component';
import { TasksComponent } from './components/management/tasks/tasks.component';
import { NavbarComponent } from './components/main/navbar/navbar.component';
import { AuthComponent } from './components/management/auth/auth.component';
import { ToolbarComponent } from './components/main/toolbar/toolbar.component';
import { BazarComponent } from './components/tools/plugins/plugins.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ConfigComponent } from './components/management/config/config.component';
import { CryptoComponent } from './components/management/crypto/crypto.component';
import { TerminalComponent } from './components/misc/terminal/terminal.component';
import { UsersComponent } from './components/management/auth/users/users.component';
import { RolesComponent } from './components/management/auth/roles/roles.component';
import { SocketsComponent } from './components/misc/sockets/sockets.component';
import { ProfileComponent } from './components/misc/profile/profile.component';
import { SetupComponent } from './components/management/config/setup/setup.component';
import { CrudifierComponent } from './components/tools/crudifier/crudifier.component';
import { EvaluatorComponent } from './components/misc/evaluator/evaluator.component';
import { DiagnosticsCacheComponent } from './components/management/cache/cache.component';
import { EndpointsComponent } from './components/tools/endpoints/endpoints.component';
import { PublishComponent } from './components/misc/sockets/publish/publish.component';
import { CrudSqlComponent } from './components/tools/crudifier/crud-sql/crud-sql.component';
import { RegisterComponent } from './components/management/auth/register/register.component';
import { SubscribeComponent } from './components/misc/sockets/subscribe/subscribe.component';
import { DiagnosticsTestsComponent } from './components/misc/assumptions/assumptions.component';
import { PublicKeysComponent } from './components/management/crypto/public-keys/public-keys.component';
import { CrudBackendComponent } from './components/tools/crudifier/crud-backend/crud-backend.component';
import { SetupAuthComponent } from './components/management/config/setup/setup-auth/setup-auth.component';
import { CrudFrontendComponent } from './components/tools/crudifier/crud-frontend/crud-frontend.component';
import { ConfigEditorComponent } from './components/management/config/config-editor/config-editor.component';
import { GenerateCrudAppComponent } from './components/tools/ide/generate-crud-app/generate-crud-app.component';
import { FileActionsComponent } from './components/tools/ide/action-buttons/file-actions/file-actions.component';
import { ChangePasswordComponent } from './components/management/auth/change-password/change-password.component';
import { CodemirrorSqlComponent } from './components/utilities/codemirror/codemirror-sql/codemirror-sql.component';
import { CrudifierTableComponent } from './components/tools/crudifier/crud-backend/crud-table/crud-table.component';
import { CreateKeypairComponent } from './components/management/config/setup/create-keypair/create-keypair.component';
import { CrudSqlExtraComponent } from './components/tools/crudifier/crud-sql/crud-sql-extra/crud-sql-extra.component';
import { FolderActionsComponent } from './components/tools/ide/action-buttons/folder-actions/folder-actions.component';
import { ServerPublicKeyComponent } from './components/management/crypto/server-public-key/server-public-key.component';
import { EndpointDetailsComponent } from './components/tools/endpoints/endpoint-details/endpoint-details.component';
import { GeneralActionsComponent } from './components/tools/ide/action-buttons/general-actions/general-actions.component';
import { CryptoInvocationsComponent } from './components/management/crypto/crypto-invocations/crypto-invocations.component';
import { CrudifyDatabaseComponent } from './components/management/config/setup/crudify-database/crudify-database.component';
import { HyperlambdaComponent } from './components/utilities/codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';
import { CrudifierSetDefaultsComponent } from './components/tools/crudifier/crud-backend/set-defaults/crudifier-set-defaults.component';
import { CrudFrontendExtraComponent } from './components/tools/crudifier/crud-frontend/crud-frontend-extra/crud-frontend-extra.component';

// Application specific modal dialog components.
import { ConfirmDialogComponent } from './components/utilities/confirm/confirm-dialog.component';
import { LoginDialogComponent } from './components/utilities/login-dialog/login-dialog.component';
import { LoadSqlDialogComponent } from './components/tools/sql/load-sql-dialog/load-sql-dialog.component';
import { SaveSqlDialogComponent } from './components/tools/sql/save-sql-dialog/save-sql-dialog.component';
import { NewTaskDialogComponent } from './components/management/tasks/new-task-dialog/new-task-dialog.component';
import { ViewAppDialogComponent } from './components/tools/plugins/view-app-dialog/view-app-dialog.component';
import { RenameFileDialogComponent } from './components/tools/ide/rename-file-dialog/rename-file-dialog.component';
import { SubscribeDialogComponent } from './components/tools/plugins/subscribe-dialog/subscribe-dialog.component';
import { NewUserDialogComponent } from './components/management/auth/users/new-user-dialog/new-user-dialog.component';
import { NewRoleDialogComponent } from './components/management/auth/roles/new-role-dialog/new-role-dialog.component';
import { PreviewFileDialogComponent } from './components/tools/ide/preview-file-dialog/preview-file-dialog.component';
import { SelectMacroDialogComponent } from './components/tools/ide/select-macro-dialog/select-macro-dialog.component';
import { RenameFolderDialogComponent } from './components/tools/ide/rename-folder-dialog/rename-folder-dialog.component';
import { ExecuteMacroDialogComponent } from './components/tools/ide/execute-macro-dialog/execute-macro-dialog.component';
import { JailUserDialogComponent } from './components/management/auth/users/jail-user-dialog/jail-user-dialog.component';
import { ViewReadmeDialogComponent } from './components/tools/plugins/view-readme-dialog/view-readme-dialog.component';
import { ScheduleTaskDialogComponent } from './components/management/tasks/schedule-task-dialog/schedule-task-dialog.component';
import { LoadSnippetDialogComponent } from './components/misc/evaluator/load-snippet-dialog/load-snippet-dialog.component';
import { SaveSnippetDialogComponent } from './components/misc/evaluator/save-snippet-dialog/save-snippet-dialog.component';
import { AddToRoleDialogComponent } from './components/management/auth/users/add-to-role-dialog/add-to-role-dialog.component';
import { NewFileFolderDialogComponent } from './components/tools/ide/new-file-folder-dialog/new-file-folder-dialog.component';
import { ExecuteEndpointDialogComponent } from './components/tools/ide/execute-endpoint-dialog/execute-endpoint-dialog.component';
import { IncompatibleFileDialogComponent } from './components/tools/ide/incompatible-file-dialog/incompatible-file-dialog.component';
import { ViewInstalledAppDialogComponent } from './components/tools/plugins/view-installed-app-dialog/view-installed-app-dialog.component';
import { CreateKeypairDialogComponent } from './components/management/crypto/server-public-key/create-keypair-dialog/create-keypair-dialog.component';
import { ImportPublicKeyDialogComponent } from './components/management/crypto/public-keys/import-public-key-dialog/import-public-key-dialog.component';
import { AddQueryParameterDialogComponent } from './components/tools/endpoints/endpoint-details/add-query-parameter-dialog/add-query-parameter-dialog.component';
import { ConfirmEmailAddressDialogComponent } from './components/tools/plugins/view-app-dialog/confirm-email-address-dialog/confirm-email-address-dialog.component';
import { CrudSqlAddArgumentDialogComponent } from './components/tools/crudifier/crud-sql/crud-sql-extra/crud-sql-add-argument-dialog/crud-sql-add-argument-dialog.component';
import { CreateAssumptionTestDialogComponent } from './components/tools/endpoints/endpoint-details/create-assumption-test-dialog/create-assumption-test-dialog.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { WarningComponent } from './components/tools/ide/warning/warning.component';
import { ExtraInfoDialogComponent } from './components/management/auth/users/extra-info-dialog/extra-info-dialog.component';
import { TableNameDialogComponent } from './components/tools/sql/table-name-dialog/table-name-dialog.component';
import { PwaUpdateDialogComponent } from './components/utilities/pwa-update-dialog/pwa-update-dialog.component';
import { OverviewComponent } from './components/dashboard/component/overview/overview.component';
import { PieChartComponent } from './components/dashboard/component/pie-chart/pie-chart.component';
import { DoughnutChartComponent } from './components/dashboard/component/doughnut-chart/doughnut-chart.component';
import { UnsavedChangesDialogComponent } from './components/tools/ide/unsaved-changes-dialog/unsaved-changes-dialog.component';
import { LastLogItemsComponent } from './components/dashboard/component/last-log-items/last-log-items.component';
import { ViewLogComponent } from './components/dashboard/component/view-log/view-log.component';
import { MainChartComponent } from './components/dashboard/component/main-chart/main-chart.component';
import { SqlWarningComponent } from './components/tools/sql/sql-warning/sql-warning.component';
import { ConnectionStringDialogComponent } from './components/management/config/connection-string-dialog/connection-string-dialog.component';
import { ConfirmUninstallDialogComponent } from './components/tools/plugins/confirm-uninstall-dialog/confirm-uninstall-dialog.component';
import { SmtpDialogComponent } from './components/management/config/smtp-dialog/smtp-dialog.component';
import { NewFieldKeyComponent } from './components/tools/sql/new-field-key/new-field-key.component';
import { NewTableComponent } from './components/tools/sql/new-table/new-table.component';
import { NewDatabaseComponent } from './components/tools/sql/new-database/new-database.component';
import { ExportTablesComponent } from './components/tools/sql/export-tables/export-tables.component';
import { EditExtraComponent } from './components/management/auth/users/edit-extra/edit-extra.component';
import { NewLinkTableComponent } from './components/tools/sql/new-link-table/new-link-table.component';
import { Redirect2hubComponent } from './components/tools/crudifier/crud-frontend/crud-frontend-extra/redirect2hub/redirect2hub.component';
import { HeaderComponent } from './_layout/core/header/header.component';
import { CoreComponent } from './_layout/core/core.component';

/**
 * The main module for your Magic Dashboard application.
 */
@NgModule({
  declarations: [
    MainComponent,
    SqlComponent,
    LoginDialogComponent,
    LoadSqlDialogComponent,
    SaveSqlDialogComponent,
    LoadSnippetDialogComponent,
    SaveSnippetDialogComponent,
    CrudifierComponent,
    EndpointsComponent,
    TasksComponent,
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
    NewFileFolderDialogComponent,
    PreviewFileDialogComponent,
    ExecuteEndpointDialogComponent,
    ServerPublicKeyComponent,
    PublicKeysComponent,
    ImportPublicKeyDialogComponent,
    CreateKeypairDialogComponent,
    CryptoInvocationsComponent,
    ConfigEditorComponent,
    DiagnosticsCacheComponent,
    InjectDirective,
    EndpointDetailsComponent,
    AddQueryParameterDialogComponent,
    CreateAssumptionTestDialogComponent,
    DiagnosticsTestsComponent,
    CrudSqlExtraComponent,
    CrudFrontendExtraComponent,
    ChangePasswordComponent,
    JailUserDialogComponent,
    RenameFileDialogComponent,
    RenameFolderDialogComponent,
    RegisterComponent,
    CrudifierTableComponent,
    CrudBackendComponent,
    CrudFrontendComponent,
    CrudSqlComponent,
    CrudSqlAddArgumentDialogComponent,
    PublishComponent,
    IdeComponent,
    TerminalComponent,
    SocketsComponent,
    BazarComponent,
    SelectMacroDialogComponent,
    ExecuteMacroDialogComponent,
    AboutComponent,
    ViewAppDialogComponent,
    ConfirmEmailAddressDialogComponent,
    ViewReadmeDialogComponent,
    ViewInstalledAppDialogComponent,
    SubscribeDialogComponent,
    ProfileComponent,
    CrudifierSetDefaultsComponent,
    GenerateCrudAppComponent,
    DashboardComponent,
    FileActionsComponent,
    FolderActionsComponent,
    GeneralActionsComponent,
    IncompatibleFileDialogComponent,
    UnsavedChangesDialogComponent,
    WarningComponent,
    ExtraInfoDialogComponent,
    TableNameDialogComponent,
    PwaUpdateDialogComponent,
    OverviewComponent,
    PieChartComponent,
    DoughnutChartComponent,
    LastLogItemsComponent,
    ViewLogComponent,
    MainChartComponent,
    SqlWarningComponent,
    ConnectionStringDialogComponent,
    ConfirmUninstallDialogComponent,
    SmtpDialogComponent,
    NewFieldKeyComponent,
    NewTableComponent,
    NewDatabaseComponent,
    ExportTablesComponent,
    EditExtraComponent,
    NewLinkTableComponent,
    Redirect2hubComponent,
    HeaderComponent,
    CoreComponent,
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserModule,
    ClipboardModule,
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
    MatBottomSheetModule,
    MatExpansionModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    ChartsModule,
    CodemirrorModule,
    MatDatepickerModule,
    MatSlideToggleModule,
    MatNativeDateModule,
    NgxMatDatetimePickerModule,
    NgxMatTimepickerModule,
    NgxMatNativeDateModule,
    AppRoutingModule,
    RecaptchaModule,
    RecaptchaV3Module,
    RecaptchaFormsModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    }),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
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
    AccessGuard
  ],
  bootstrap: [MainComponent],
})
export class AppModule { }
