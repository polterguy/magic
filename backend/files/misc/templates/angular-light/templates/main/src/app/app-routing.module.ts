import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { Shell } from '@app/shell/shell.service';

// Then importing all CRUD components.
[[imports-only-main]]

const routes: Routes = [
  Shell.childRoutes([{ path: 'about', loadChildren: () => import('./about/about.module').then((m) => m.AboutModule) }]),
  // Fallback when no prior route is matched
  { path: '**', redirectTo: '', pathMatch: 'full' },

  // Then routes for all CRUD components.
  [[routes]]
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
  providers: [],
})
export class AppRoutingModule {}
