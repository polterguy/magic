
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccessGuard } from 'src/app/access-guards/access.guard';
import { AuthBaseComponent } from 'src/app/components/public/authentication/auth-base/auth-base.component';
import { MainComponent } from 'src/app/components/protected/core/main/main.component';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    canActivate: [AccessGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('src/app/components/protected/dashboard/_module/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'setup',
        loadChildren: () => import('src/app/components/protected/setup/_module/setup.module').then(m => m.SetupModule)
      },
      {
        path: 'user-roles-management',
        loadChildren: () => import('src/app/components/protected/manage/user-and-roles/_module/users-roles.module').then(m => m.UsersRolesModule)
      },
      {
        path: 'sql-studio',
        loadChildren: () => import('src/app/components/protected/create/sql-studio/_module/sql-studio.module').then(m => m.SqlStudioModule)
      },
      {
        path: 'endpoints',
        loadChildren: () => import('src/app/components/protected/manage/endpoints/_module/endpoints.module').then(m => m.EndpointsModule)
      },
      {
        path: 'databases',
        loadChildren: () => import('src/app/components/protected/manage/databases/_module/databases.module').then(m => m.DatabasesModule)
      },
      {
        path: 'endpoint-generator',
        loadChildren: () => import('src/app/components/protected/create/endpoint-generator/_module/endpoint.module').then(m => m.EndpointModule)
      },
      {
        path: 'plugins',
        loadChildren: () => import('src/app/components/protected/manage/plugins/_module/plugins.module').then(m => m.PluginsModule)
      },
      {
        path: 'hyperlambda-playground',
        loadChildren: () => import('src/app/components/protected/manage/hyperlambda-playground/_module/hyperlambda-playground.module').then(m => m.HyperlambdaPlaygroundModule)
      },
      {
        path: 'hyper-ide',
        loadChildren: () => import('src/app/components/protected/create/hyper-ide/module/ide.module').then(m => m.IdeModule)
      },
      {
        path: 'chatbot-wizard',
        loadChildren: () => import('src/app/components/protected/create/chatbot-wizard/_module/chatbot-wizard.module').then(m => m.ChatbotWizardModule)
      },
      {
        path: 'tasks',
        loadChildren: () => import('src/app/components/protected/manage/tasks/_module/task.module').then(m => m.TaskModule)
      },
      {
        path: 'health-check',
        loadChildren: () => import('src/app/components/protected/misc/health-check/_module/health-check.module').then(m => m.HealthCheckModule)
      },
      {
        path: 'configuration',
        loadChildren: () => import('src/app/components/protected/misc/configuration/_module/config.module').then(m => m.ConfigModule)
      },
      {
        path: 'log',
        loadChildren: () => import('src/app/components/protected/misc/log/_module/log.module').then(m => m.LogModule)
      },
      {
        path: 'user-profile',
        loadChildren: () => import('src/app/components/protected/user/profile/_module/profile.module').then(m => m.ProfileModule)
      },
      {
        path: 'machine-learning',
        loadChildren: () => import('src/app/components/protected/manage/machine-learning/_module/machine-learning.module').then(m => m.MachineLearningTrainingModule)
      },
    ]
  },
  {
    path: 'authentication',
    component: AuthBaseComponent,
    loadChildren: () => import('src/app/components/public/authentication/_module/auth.module').then(m => m.AuthModule),
  },
  {
    path: 'not-found',
    loadChildren: () => import('src/app/components/public/not-found/_module/notfound.module').then(m => m.NotfoundModule),
  },
  { path: '**', redirectTo: 'not-found' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
