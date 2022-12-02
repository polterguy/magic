import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthBaseComponent } from '../auth-base/auth-base.component';
import { LoginComponent } from '../login/login.component';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';
import { ResetPasswordComponent } from '../reset-password/reset-password.component';


const routes: Routes = [
  // {
  //   path: '',
  //   component: AuthBaseComponent,
  //   children: [
      {
        path: 'login',
        component: LoginComponent
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent
      },
      {
        path: 'reset-password',
        component: ResetPasswordComponent
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' }
  //   ]
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
