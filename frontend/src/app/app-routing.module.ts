
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EndpointsComponent } from './components/endpoints/endpoints.component';
import { HomeComponent } from './components/endpoints/home/home.component';
import { EvaluatorComponent } from './components/evaluator/evaluator.component';
import { FilesComponent } from './components/files/files.component';

const routes: Routes = [
  { path: 'files', component: FilesComponent },
  { path: 'evaluator', component: EvaluatorComponent },
  { path: 'endpoints', component: EndpointsComponent },
  { path: '', component: HomeComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
