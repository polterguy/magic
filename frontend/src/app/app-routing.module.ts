
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Application specific imports.
import { IdeComponent } from './components/tools/ide/ide.component';
import { LogComponent } from './components/analytics/log/log.component';
import { SqlComponent } from './components/tools/sql/sql.component';
import { AuthComponent } from './components/management/auth/auth.component';
import { TasksComponent } from './components/tools/tasks/tasks.component';
import { BazarComponent } from './components/management/bazar/bazar.component';
import { FilesComponent } from './components/files/files.component';
import { AboutComponent } from './components/about/about.component';
import { ConfigComponent } from './components/management/config/config.component';
import { CryptoComponent } from './components/management/crypto/crypto.component';
import { ProfileComponent } from './components/management/profile/profile.component';
import { TerminalComponent } from './components/tools/terminal/terminal.component';
import { CrudifierComponent } from './components/tools/crudifier/crudifier.component';
import { EndpointsComponent } from './components/analytics/endpoints/endpoints.component';
import { EvaluatorComponent } from './components/tools/evaluator/evaluator.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RegisterComponent } from './components/management/auth/register/register.component';
import { ConfirmEmailComponent } from './components/management/auth/confirm-email/confirm-email.component';
import { ChangePasswordComponent } from './components/management/auth/change-password/change-password.component';
import { DiagnosticsTestsComponent } from './components/analytics/assumptions/assumptions.component';
import { DiagnosticsCache } from './components/analytics/cache/cache.component';
import { SocketsComponent } from './components/analytics/sockets/sockets.component';

/**
 * Routes for application.
 */
const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'sql', component: SqlComponent },

  // Avoids re-initializing component as user opens and closes view details / URL link
  { path: 'ide', component: IdeComponent },
  { path: 'log', component: LogComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'tasks', component: TasksComponent },
  { path: 'bazar', component: BazarComponent },
  { path: 'about', component: AboutComponent },
  { path: 'cache', component: DiagnosticsCache },
  { path: 'config', component: ConfigComponent },
  { path: 'crypto', component: CryptoComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'sockets', component: SocketsComponent },
  { path: 'terminal', component: TerminalComponent },
  { path: 'file-system', component: FilesComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'endpoints', component: EndpointsComponent },
  { path: 'evaluator', component: EvaluatorComponent },
  { path: 'crudifier', component: CrudifierComponent },
  { path: 'confirm-email', component: ConfirmEmailComponent },
  { path: 'assumptions', component: DiagnosticsTestsComponent },
  { path: 'change-password', component: ChangePasswordComponent },
];

/**
 * Main module for application.
 */
@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
