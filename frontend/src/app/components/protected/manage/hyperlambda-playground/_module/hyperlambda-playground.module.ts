
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HyperlambdaPlaygroundComponent } from '../hyperlambda-playground.component';
import { HyperlambdaPlaygroundRoutingModule } from './hyperlambda-playground.routing.module';
import { ComponentsModule } from 'src/app/components/protected/common/components.module';
import { MaterialModule } from 'src/app/modules/material.module';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';

@NgModule({
  declarations: [
    HyperlambdaPlaygroundComponent
  ],
  imports: [
    CommonModule,
    HyperlambdaPlaygroundRoutingModule,
    ComponentsModule,
    MaterialModule,
    CodemirrorModule,
  ]
})
export class HyperlambdaPlaygroundModule { }
