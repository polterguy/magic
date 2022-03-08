
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Application specific imports.
import { AccessGuard } from './access.guard';
import { IdeComponent } from './components/tools/ide/ide.component';
import { AboutComponent } from './components/about/about.component';
import { SqlComponent } from './components/tools/sql/sql.component';
import { LogComponent } from './components/analytics/log/log.component';
import { TasksComponent } from './components/tools/tasks/tasks.component';
import { AuthComponent } from './components/management/auth/auth.component';
import { BazarComponent } from './components/management/bazar/bazar.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ConfigComponent } from './components/management/config/config.component';
import { CryptoComponent } from './components/management/crypto/crypto.component';
import { TerminalComponent } from './components/tools/terminal/terminal.component';
import { SocketsComponent } from './components/analytics/sockets/sockets.component';
import { ProfileComponent } from './components/management/profile/profile.component';
import { CrudifierComponent } from './components/tools/crudifier/crudifier.component';
import { EvaluatorComponent } from './components/tools/evaluator/evaluator.component';
import { DiagnosticsCacheComponent } from './components/analytics/cache/cache.component';
import { EndpointsComponent } from './components/analytics/endpoints/endpoints.component';
import { RegisterComponent } from './components/management/auth/register/register.component';
import { DiagnosticsTestsComponent } from './components/analytics/assumptions/assumptions.component';
import { ConfirmEmailComponent } from './components/management/auth/confirm-email/confirm-email.component';
import { ChangePasswordComponent } from './components/management/auth/change-password/change-password.component';

/**
 * Routes for application.
 */
const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  },
  {
    path: 'sql',
    component: SqlComponent,
    canActivate: [AccessGuard],
    data: { page: "sql" }
  },

  // Avoids re-initializing component as user opens and closes view details / URL link
  {
    path: 'ide',
    component: IdeComponent,
    canActivate: [AccessGuard],
    data: { page:'ide'}
  },
  {
    path: 'log',
    component: LogComponent,
    canActivate: [AccessGuard],
    data: { page: 'log' }
  },
  {
    path: 'auth',
    component: AuthComponent,
    canActivate: [AccessGuard],
    data: { page: 'auth' }
  },
  {
    path: 'tasks',
    component: TasksComponent,
    canActivate: [AccessGuard],
    data: { page: 'tasks' }
  },
  {
    path: 'bazar',
    component: BazarComponent,
    canActivate: [AccessGuard],
    data: { page: 'bazar' }
  },
  
  {
    path: 'cache',
    component: DiagnosticsCacheComponent,
    canActivate: [AccessGuard],
    data: { page: 'cache' }
  },
  
  {
    path: 'crypto',
    component: CryptoComponent,
    canActivate: [AccessGuard],
    data: { page: 'crypto' }
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AccessGuard],
    data: { page: 'profile' }
  },
  {
    path: 'sockets',
    component: SocketsComponent,
    canActivate: [AccessGuard],
    data: { page: 'sockets' }
  },
  {
    path: 'terminal',
    component: TerminalComponent,
    canActivate: [AccessGuard],
    data: { page: 'terminal' }
  },  
  {
    path: 'endpoints',
    component: EndpointsComponent,
    canActivate: [AccessGuard],
    data: { page: 'endpoints' }
  },
  {
    path: 'evaluator',
    component: EvaluatorComponent,
    canActivate: [AccessGuard],
    data: { page: 'evaluator' }
  },
  {
    path: 'crudifier',
    component: CrudifierComponent,
    canActivate: [AccessGuard],
    data: { page:'crudifier'}
  },
  {
    path: 'assumptions',
    component: DiagnosticsTestsComponent,
    canActivate: [AccessGuard],
    data: { page: 'assumptions' }
  },
  {
    path: 'config',
    component: ConfigComponent
  },
  {
    path: 'about',
    component: AboutComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'change-password',
    component: ChangePasswordComponent
  },
  {
    path: 'confirm-email',
    component: ConfirmEmailComponent
  },
  {
    path:
      '**', redirectTo: ''
  }
];

/**
 * Main module for application.
 */
@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
