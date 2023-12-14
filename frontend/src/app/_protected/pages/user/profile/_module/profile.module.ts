
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
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
