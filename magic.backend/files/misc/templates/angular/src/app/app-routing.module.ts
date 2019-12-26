import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

[[imports]]

const routes: Routes = [
[[routes]]];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
