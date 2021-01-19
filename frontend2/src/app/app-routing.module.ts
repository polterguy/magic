
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Application specific imports.
import { LogComponent } from './components/log/log.component';
import { SqlComponent } from './components/sql/sql.component';
import { AuthComponent } from './components/auth/auth.component';
import { HomeComponent } from './components/home/home.component';
import { TasksComponent } from './components/tasks/tasks.component';
import { FilesComponent } from './components/files/files.component';
import { ConfigComponent } from './components/config/config.component';
import { CryptoComponent } from './components/crypto/crypto.component';
import { CrudifierComponent } from './components/crudifier/crudifier.component';
import { EndpointsComponent } from './components/endpoints/endpoints.component';
import { EvaluatorComponent } from './components/evaluator/evaluator.component';
import { DiagnosticsComponent } from './components/diagnostics/diagnostics.component';
import { ConfirmEmailComponent } from './components/auth/confirm-email/confirm-email.component';
import { ChangePasswordComponent } from './components/auth/change-password/change-password.component';

/**
 * Routes for application.
 */
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'sql', component: SqlComponent },

  // Avoids re-initializing component as user opens and closes view details / URL link
  { path: 'log', redirectTo: 'log/' },
  { path: 'log/:id', component: LogComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'tasks', component: TasksComponent },
  { path: 'config', component: ConfigComponent },
  { path: 'crypto', component: CryptoComponent },
  { path: 'file-system', component: FilesComponent },
  { path: 'endpoints', component: EndpointsComponent },
  { path: 'evaluator', component: EvaluatorComponent },
  { path: 'crudifier', component: CrudifierComponent },
  { path: 'diagnostics', component: DiagnosticsComponent },
  { path: 'confirm-email', component: ConfirmEmailComponent },
  { path: 'change-password', component: ChangePasswordComponent },
];

/**
 * Main module for application.
 */
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
