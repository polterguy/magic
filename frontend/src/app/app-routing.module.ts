
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
        loadChildren: () => import('./_protected/pages/manage/user-and-roles/_module/users-roles.module').then(m => m.UsersRolesModule)
      },
      {
        path: 'sql-studio',
        loadChildren: () => import('./_protected/pages/create/sql-studio/_module/sql-studio.module').then(m => m.SqlStudioModule)
      },
      {
        path: 'endpoints',
        loadChildren: () => import('./_protected/pages/manage/endpoints/_module/endpoints.module').then(m => m.EndpointsModule)
      },
      {
        path: 'sockets',
        loadChildren: () => import('./_protected/pages/manage/sockets/_module/socket.module').then(m => m.SocketModule)
      },
      {
        path: 'databases',
        loadChildren: () => import('./_protected/pages/create/databases/_module/databases.module').then(m => m.DatabasesModule)
      },
      {
        path: 'endpoint-generator',
        loadChildren: () => import('./_protected/pages/create/endpoint-generator/_module/endpoint.module').then(m => m.EndpointModule)
      },
      {
        path: 'frontend-generator',
        loadChildren: () => import('./_protected/pages/create/frontend-generator/_module/frontend-generator.module').then(m => m.FrontendGeneratorModule)
      },
      {
        path: 'plugins',
        loadChildren: () => import('./_protected/pages/manage/plugins/_module/plugins.module').then(m => m.PluginsModule)
      },
      {
        path: 'hyperlambda-playground',
        loadChildren: () => import('./_protected/pages/manage/hyperlambda-playground/_module/hyperlambda-playground.module').then(m => m.HyperlambdaPlaygroundModule)
      },
      {
        path: 'hyper-ide',
        data: {
          type: 'backend'
        },
        loadChildren: () => import('./_protected/pages/create/hyper-ide/_module/ide.module').then(m => m.IdeModule)
      },
      {
        path: 'frontend-ide',
        data: {
          type: 'frontend',
        },
        loadChildren: () => import('./_protected/pages/create/hyper-ide/_module/ide.module').then(m => m.IdeModule)
      },
      {
        path: 'tasks',
        loadChildren: () => import('./_protected/pages/manage/tasks/_module/task.module').then(m => m.TaskModule)
      },
      {
        path: 'health-check',
        loadChildren: () => import('./_protected/pages/misc/health-check/_module/health-check.module').then(m => m.HealthCheckModule)
      },
      {
        path: 'configuration',
        loadChildren: () => import('./_protected/pages/misc/configuration/_module/config.module').then(m => m.ConfigModule)
      },
      {
        path: 'log',
        loadChildren: () => import('./_protected/pages/misc/log/_module/log.module').then(m => m.LogModule)
      },
      {
        path: 'cryptography',
        loadChildren: () => import('./_protected/pages/user/cryptography/_module/server-key.module').then(m => m.ServerKeyModule)
      },
      {
        path: 'user-profile',
        loadChildren: () => import('./_protected/pages/user/profile/_module/profile.module').then(m => m.ProfileModule)
      },
      {
        path: 'help-center',
        loadChildren: () => import('./_protected/pages/misc/help-center/_module/help-center.module').then(m => m.HelpCenterModule)
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
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
