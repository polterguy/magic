
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Application specific imports.
import { AccessGuard } from './access.guard';
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
    canActivate: [AccessGuard],
    data: { check: (access: AccessModel) : boolean => access.sql.execute_access }
  },
  {
    path: 'ide',
    component: IdeComponent,
    canActivate: [AccessGuard],
    data: { check: (access: AccessModel) : boolean => access.files.list_files && access.files.list_folders }
  },
  {
    path: 'log',
    component: LogComponent,
    canActivate: [AccessGuard],
    data: { check: (access: AccessModel) : boolean => access.log.read }
  },
  {
    path: 'auth',
    component: AuthComponent,
    canActivate: [AccessGuard],
    data: { check: (access: AccessModel) : boolean => access.auth.view_users && access.auth.view_roles }
  },
  {
    path: 'tasks',
    component: TasksComponent,
    canActivate: [AccessGuard],
    data: { check: (access: AccessModel) : boolean => access.auth.view_users && access.auth.view_roles }
  },
  {
    path: 'plugins',
    component: BazarComponent,
    canActivate: [AccessGuard],
    data: { check: (access: AccessModel) : boolean => access.bazar.get_manifests }
  },

  {
    path: 'cache',
    component: DiagnosticsCacheComponent,
    canActivate: [AccessGuard],
    data: { check: (access: AccessModel) : boolean => access.cache.read && access.cache.count }
  },

  {
    path: 'keys',
    component: CryptoComponent,
    canActivate: [AccessGuard],
    data: { check: (access: AccessModel) : boolean => access.crypto.import_public_key }
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AccessGuard],
    data: { check: (access: AccessModel) : boolean => access.profile }
  },
  {
    path: 'sockets',
    component: SocketsComponent,
    canActivate: [AccessGuard],
    data: { check: (access: AccessModel) : boolean => access.sockets.read }
  },
  {
    path: 'terminal',
    component: TerminalComponent,
    canActivate: [AccessGuard],
    data: { check: (access: AccessModel) : boolean => access.terminal.execute }
  },
  {
    path: 'endpoints',
    component: EndpointsComponent,
    canActivate: [AccessGuard],
    data: { check: (access: AccessModel) : boolean => access.endpoints.view }
  },
  {
    path: 'evaluator',
    component: EvaluatorComponent,
    canActivate: [AccessGuard],
    data: { check: (access: AccessModel) : boolean => access.eval.execute }
  },
  {
    path: 'crud-generator',
    component: CrudifierComponent,
    canActivate: [AccessGuard],
    data: { check: (access: AccessModel) : boolean => access.crud.generate_crud || access.crud.generate_sql || access.crud.generate_frontend }
  },
  {
    path: 'assumptions',
    component: DiagnosticsTestsComponent,
    canActivate: [AccessGuard],
    data: { check: (access: AccessModel) : boolean => access.endpoints.assumptions }
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
