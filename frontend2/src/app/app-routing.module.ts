
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
import { CryptoComponent } from './components/crypto/crypto.component';
import { CrudifierComponent } from './components/crudifier/crudifier.component';
import { EndpointsComponent } from './components/endpoints/endpoints.component';
import { EvaluatorComponent } from './components/evaluator/evaluator.component';

/**
 * Routes for application.
 */
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'sql', component: SqlComponent },
  { path: 'log', component: LogComponent },
  { path: 'log/:id', component: LogComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'tasks', component: TasksComponent },
  { path: 'crypto', component: CryptoComponent },
  { path: 'file-system', component: FilesComponent },
  { path: 'endpoints', component: EndpointsComponent },
  { path: 'evaluator', component: EvaluatorComponent },
  { path: 'crudifier', component: CrudifierComponent },
];

/**
 * Main module for application.
 */
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
