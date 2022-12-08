
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccessGuard } from './access.guard';
import { AuthBaseComponent } from './public/authentication/auth-base/auth-base.component';
import { CoreComponent } from './_layout/core/core.component';

const routes: Routes = [
  {
    path: '',
    component: CoreComponent,
    canActivate: [AccessGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./_protected/pages/dashboard/_module/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'setup',
        loadChildren: () => import('./_protected/pages/setup/_module/setup.module').then(m => m.SetupModule)
      },
      {
        path: 'user-roles-management',
        loadChildren: () => import('./_protected/pages/administration/user-roles/_module/users-roles.module').then(m => m.UsersRolesModule)
      },
      {
        path: 'sql-studio',
        loadChildren: () => import('./_protected/pages/administration/generated-database/_module/g-database.module').then(m => m.GDatabaseModule)
      },
      {
        path: 'endpoints',
        loadChildren: () => import('./_protected/pages/administration/generated-endpoints/_module/generated-endpoints.module').then(m => m.GeneratedEndpointsModule)
      },
      {
        path: 'sockets',
        loadChildren: () => import('./_protected/pages/administration/generated-sockets/_module/socket.module').then(m => m.SocketModule)
      },
      {
        path: 'database-management',
        loadChildren: () => import('./_protected/pages/tools/database/_module/database.module').then(m => m.DatabaseModule)
      },
      {
        path: 'endpoint-generator',
        loadChildren: () => import('./_protected/pages/tools/endpoints/_module/endpoint.module').then(m => m.EndpointModule)
      },
      {
        path: 'frontend-generator',
        loadChildren: () => import('./_protected/pages/tools/frontend-generator/_module/frontend-generator.module').then(m => m.FrontendGeneratorModule)
      },
      {
        path: 'plugins',
        loadChildren: () => import('./_protected/pages/tools/plugins/_module/plugins.module').then(m => m.PluginsModule)
      },
      {
        path: 'hyperlambda-playground',
        loadChildren: () => import('./_protected/pages/tools/hl-playground/_module/hl-playground.module').then(m => m.HlPlaygroundModule)
      },
      {
        path: 'hyper-ide',
        data: {
          type: 'backend'
        },
        loadChildren: () => import('./_protected/pages/tools/hyper-ide/_module/ide.module').then(m => m.IdeModule)
      },
      {
        path: 'generated-frontend',
        data: {
          type: 'frontend',
        },
        loadChildren: () => import('./_protected/pages/tools/hyper-ide/_module/ide.module').then(m => m.IdeModule)
      },
      {
        path: 'tasks',
        loadChildren: () => import('./_protected/pages/tools/task-scheduler/_module/task.module').then(m => m.TaskModule)
      },
      {
        path: 'endpoints-health-check',
        loadChildren: () => import('./_protected/pages/setting-security/health-check/_module/health-check.module').then(m => m.HealthCheckModule)
      },
      {
        path: 'configuration',
        loadChildren: () => import('./_protected/pages/setting-security/configuration/_module/config.module').then(m => m.ConfigModule)
      },
      {
        path: 'log',
        loadChildren: () => import('./_protected/pages/setting-security/log/_module/log.module').then(m => m.LogModule)
      },
      {
        path: 'server-key-setting',
        loadChildren: () => import('./_protected/pages/setting-security/server-key-setting/_module/server-key.module').then(m => m.ServerKeyModule)
      },
      {
        path: 'user-profile',
        loadChildren: () => import('./_protected/pages/user/profile/_module/profile.module').then(m => m.ProfileModule)
      },
    ]
  },
  {
    path: 'authentication',
    component: AuthBaseComponent,
    loadChildren: () => import('./public/authentication/_module/auth.module').then(m => m.AuthModule),
  },
  {
    path: 'not-found',
    loadChildren: () => import('./public/not-found/lazy-loading/notfound.module').then(m => m.NotfoundModule),
  },
  { path: '**', redirectTo: 'not-found' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {onSameUrlNavigation: 'reload'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
