
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EndpointsComponent } from './endpoints/endpoints.component';
import { HomeComponent } from './home/home.component';
import { EvaluatorComponent } from './evaluator/evaluator.component';

const routes: Routes = [
  { path: 'evaluator', component: EvaluatorComponent },
  { path: 'endpoints', component: EndpointsComponent },
  { path: '', component: HomeComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
