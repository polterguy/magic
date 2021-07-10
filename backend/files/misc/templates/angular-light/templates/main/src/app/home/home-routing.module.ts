import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';

import { HomeComponent } from './home.component';
import { Shell } from '@app/shell/shell.service';

// Then importing all CRUD components.
[[imports-only-main]]

const routes: Routes = [
  Shell.childRoutes([
    { path: '', component: HomeComponent, data: { title: marker('[[name]] - Home') } },

    // Then routes for all CRUD components.
[[routes]]
  ]),
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [],
})
export class HomeRoutingModule {}
