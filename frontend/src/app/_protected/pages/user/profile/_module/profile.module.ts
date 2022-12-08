
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileComponent } from '../profile.component';
import { ProfileRoutingModule } from './profile.routing.module';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    ProfileComponent
  ],
  imports: [
    CommonModule,
    ProfileRoutingModule,
    MaterialModule,
    FormsModule
  ]
})
export class ProfileModule { }
