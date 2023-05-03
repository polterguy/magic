
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FrontendGeneratorComponent } from '../frontend-generator.component';
import { FrontendGeneratorRoutingModule } from './frontend-generator.routing.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { MaterialModule } from 'src/app/material.module';
import { AutoGenerateComponent } from '../auto-generate/auto-generate.component';
import { UploadExistingComponent } from '../upload-existing/upload-existing.component';
import { FormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';

@NgModule({
  declarations: [
    FrontendGeneratorComponent,
    AutoGenerateComponent,
    UploadExistingComponent
  ],
  imports: [
    CommonModule,
    FrontendGeneratorRoutingModule,
    ComponentsModule,
    MaterialModule,
    FormsModule,
    CodemirrorModule
  ]
})
export class FrontendGeneratorModule { }
