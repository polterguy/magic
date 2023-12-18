
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PluginsComponent } from '../plugins.component';
import { MaterialModule } from 'src/app/modules/material.module';
import { ComponentsModule } from 'src/app/components/common/components.module';
import { PluginsRoutingModule } from './plugins.routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ViewPluginComponent } from '../components/view-app/view-plugin.component';
import { SharedModule } from 'src/app/modules/shared.module';

@NgModule({
  declarations: [
    PluginsComponent,
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
