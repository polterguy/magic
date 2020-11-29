
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Application specific imports.
import { SqlComponent } from './components/sql/sql.component';
import { HomeComponent } from './components/home/home.component';
import { CrudifierComponent } from './components/crudifier/crudifier.component';
import { EndpointsComponent } from './components/endpoints/endpoints.component';

/**
 * Routes for application.
 */
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'sql', component: SqlComponent },
  { path: 'endpoints', component: EndpointsComponent },
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
