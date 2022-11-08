import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PluginsComponent } from '../plugins.component';
import { MaterialModule } from 'src/app/material.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { PluginsRoutingModule } from './plugins.routing.module';
import { SearchboxComponent } from '../components/searchbox/searchbox.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ViewPluginComponent } from '../components/view-app/view-plugin.component';
import { SharedModule } from 'src/app/shared.module';



@NgModule({
  declarations: [
    PluginsComponent,
    SearchboxComponent,
    ViewPluginComponent
  ],
  imports: [
    CommonModule,
    PluginsRoutingModule,
    MaterialModule,
    ComponentsModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ]
})
export class PluginsModule { }
