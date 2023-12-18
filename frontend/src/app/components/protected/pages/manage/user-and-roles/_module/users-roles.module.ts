
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UsersRolesRoutingModule } from './users-roles.routing.module';
import { UsersListComponent } from '../users-list/users-list.component';
import { RolesListComponent } from '../roles-list/roles-list.component';
import { ComponentsModule } from 'src/app/components/common/components.module';
import { UserRolesComponent } from '../user-roles.component';
import { SharedTopBarComponent } from '../components/shared-top-bar/shared-top-bar.component';
import { ChangePasswordDialogComponent } from '../components/change-password-dialog/change-password-dialog.component';
import { NewUserDialogComponent } from '../components/new-user-dialog/new-user-dialog.component';
import { EditUserDialogComponent } from '../components/edit-user-dialog/edit-user-dialog.component';
import { ManageRoleDialogComponent } from '../components/manage-role-dialog/manage-role-dialog.component';
import { AddExtraFieldsDialogComponent } from '../components/add-extra-fields-dialog/add-extra-fields-dialog.component';

@NgModule({
  declarations: [
    UserRolesComponent,
    UsersListComponent,
    RolesListComponent,
    SharedTopBarComponent,
    NewUserDialogComponent,
    EditUserDialogComponent,
    ManageRoleDialogComponent,
    ChangePasswordDialogComponent,
    AddExtraFieldsDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule,
    MaterialModule,
    UsersRolesRoutingModule
  ]
})
export class UsersRolesModule { }
