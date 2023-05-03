
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotfoundRoutingModule } from './notfound.routing.module';
import { MatButtonModule } from '@angular/material/button';
import { NotFoundComponent } from '../not-found.component';

@NgModule({
  declarations: [NotFoundComponent],
  imports: [
    CommonModule,
    NotfoundRoutingModule,
    MatButtonModule
  ]
})
export class NotfoundModule { }
