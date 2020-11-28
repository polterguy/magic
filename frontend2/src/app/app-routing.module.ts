import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { SqlComponent } from './components/sql/sql.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'sql', component: SqlComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
