// Angular core imports.
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Importing components, first "global/common" components.
import { HomeComponent } from './components/home/home.component';

// Then importing all CRUD components.
[[imports-only-main]]

const routes: Routes = [

  // First common/global routes.
  { path: '', component: HomeComponent },

  // Then routes for all CRUD components.
[[routes]]];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
