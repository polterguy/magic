import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConfigurationComponent } from '../configuration.component';
import { SetupComponent } from '../setup/setup.component';

const routes: Routes = [
  {
    path: '',
    component: ConfigurationComponent,
  },
  {
    path: 'setup',
    component: SetupComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConfigRoutingModule { }
