
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlPlaygroundComponent } from '../hl-playground.component';
import { HlPlaygroundRoutingModule } from './hl-playground.routing.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { MaterialModule } from 'src/app/material.module';
import { CmModule } from 'src/app/codemirror/_module/cm.module';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';

@NgModule({
  declarations: [
    HlPlaygroundComponent
  ],
  imports: [
    CommonModule,
    HlPlaygroundRoutingModule,
    ComponentsModule,
    MaterialModule,
    CmModule,
    CodemirrorModule
  ]
})
export class HlPlaygroundModule { }
