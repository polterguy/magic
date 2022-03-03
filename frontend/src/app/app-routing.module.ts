
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
import { DiagnosticsCacheComponent } from './components/analytics/cache/cache.component';
import { SocketsComponent } from './components/analytics/sockets/sockets.component';
import { AccessGuard } from './access.guard';

/**
 * Routes for application.
 */
const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [AccessGuard]
  },
  {
    path: 'sql',
    component: SqlComponent,
    canActivate: [AccessGuard]
  },

  // Avoids re-initializing component as user opens and closes view details / URL link
  {
    path: 'ide',
    component: IdeComponent,
    canActivate: [AccessGuard]
  },
  {
    path: 'log',
    component: LogComponent,
    canActivate: [AccessGuard]
  },
  {
    path: 'auth',
    component: AuthComponent,
    canActivate: [AccessGuard]
  },
  {
    path: 'tasks',
    component: TasksComponent,
    canActivate: [AccessGuard]
  },
  {
    path: 'bazar',
    component: BazarComponent,
    canActivate: [AccessGuard]
  },
  
  {
    path: 'cache',
    component: DiagnosticsCacheComponent,
    canActivate: [AccessGuard]
  },
  
  {
    path: 'crypto',
    component: CryptoComponent,
    canActivate: [AccessGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AccessGuard]
  },
  {
    path: 'sockets',
    component: SocketsComponent,
    canActivate: [AccessGuard]
  },
  {
    path: 'terminal',
    component: TerminalComponent,
    canActivate: [AccessGuard]
  },  
  {
    path: 'endpoints',
    component: EndpointsComponent,
    canActivate: [AccessGuard]
  },
  {
    path: 'evaluator',
    component: EvaluatorComponent,
    canActivate: [AccessGuard]
  },
  {
    path: 'crudifier',
    component: CrudifierComponent,
    canActivate: [AccessGuard]
  },
  {
    path: 'assumptions',
    component: DiagnosticsTestsComponent,
    canActivate: [AccessGuard]
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
