
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Application specific imports.
import { AccessModel } from './models/access.model';
import { IdeComponent } from './components/tools/ide/ide.component';
import { AboutComponent } from './components/about/about.component';
import { SqlComponent } from './components/tools/sql/sql.component';
import { LogComponent } from './components/misc/log/log.component';
import { TasksComponent } from './components/management/tasks/tasks.component';
import { AuthComponent } from './components/management/auth/auth.component';
import { BazarComponent } from './components/tools/plugins/plugins.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ConfigComponent } from './components/management/config/config.component';
import { CryptoComponent } from './components/management/crypto/crypto.component';
import { TerminalComponent } from './components/misc/terminal/terminal.component';
import { SocketsComponent } from './components/misc/sockets/sockets.component';
import { ProfileComponent } from './components/misc/profile/profile.component';
import { CrudifierComponent } from './components/tools/crudifier/crudifier.component';
import { EvaluatorComponent } from './components/misc/evaluator/evaluator.component';
import { DiagnosticsCacheComponent } from './components/management/cache/cache.component';
import { EndpointsComponent } from './components/tools/endpoints/endpoints.component';
import { RegisterComponent } from './components/management/auth/register/register.component';
import { DiagnosticsTestsComponent } from './components/misc/assumptions/assumptions.component';
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
  },
  {
    path: 'ide',
    component: IdeComponent,
  },
  {
    path: 'log',
    component: LogComponent,
  },
  {
    path: 'auth',
    component: AuthComponent,
  },
  {
    path: 'tasks',
    component: TasksComponent,
  },
  {
    path: 'plugins',
    component: BazarComponent,
  },

  {
    path: 'cache',
    component: DiagnosticsCacheComponent,
  },

  {
    path: 'keys',
    component: CryptoComponent,
  },
  {
    path: 'profile',
    component: ProfileComponent,
  },
  {
    path: 'sockets',
    component: SocketsComponent,
  },
  {
    path: 'terminal',
    component: TerminalComponent,
  },
  {
    path: 'endpoints',
    component: EndpointsComponent,
  },
  {
    path: 'evaluator',
    component: EvaluatorComponent,
  },
  {
    path: 'crud-generator',
    component: CrudifierComponent,
  },
  {
    path: 'assumptions',
    component: DiagnosticsTestsComponent,
  },
  {
    path: 'config',
    component: ConfigComponent,
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
    component: ChangePasswordComponent,
  },
  {
    path: '**',
    redirectTo: '',
  }
];

/**
 * Routing module for application.
 */
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
