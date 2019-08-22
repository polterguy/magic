
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EndpointsComponent } from './endpoints/endpoints.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: 'endpoints', component: EndpointsComponent },
  { path: '', component: HomeComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
