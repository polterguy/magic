
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from 'src/app/components/common/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/services/general.service';
import { ManageRoleDialogComponent } from '../components/manage-role-dialog/manage-role-dialog.component';
import { Role } from '../_models/role.model';
import { RoleService } from '../_services/role.service';

/**
 * Helper component for displaying all roles in the system, and allowing the user to edit
 * and manage his or her roles.
 */
@Component({
  selector: 'app-roles-list',
  templateUrl: './roles-list.component.html',
  styleUrls: ['./roles-list.component.scss']
})
export class RolesListComponent {

  @Input() rolesList: any = [];
  @Output() getRolesList = new EventEmitter<any>();

  displayedColumns: string[] = [
    'name',
    'description',
    'actions'
  ];

  constructor(
    private dialog: MatDialog,
    private roleService: RoleService,
    private generalService: GeneralService) { }

  systemRole(role: string) {

    switch (role) {
      case 'root':
      case 'guest':
      case 'reset-password':
      case 'unconfirmed':
      case 'blocked':
        return true;

      default:
        return false;
    }
  }

  deleteRole(role: Role) {

    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Delete Role ${role.name}`,
        description_extra: 'This action cannot be undone and will be permanent.<br/><br/>Please type in the <span class="fw-bold">role\'s name</span> below.',
        action_btn: 'Delete role',
        action_btn_color: 'warn',
        bold_description: true,
        extra: {
          details: role,
          action: 'confirmInput',
          fieldToBeTypedTitle: 'role',
          fieldToBeTypedValue: role.name,
          icon: 'delete'
        }
      }
    }).afterClosed().subscribe((result: string) => {

      if (result === 'confirm') {

        this.generalService.showLoading();
        this.roleService.delete(role.name).subscribe({
          next: () => {

            this.generalService.hideLoading();
            this.generalService.showFeedback(`${role.name} was successfully deleted`, 'successMessage');
            this.updateList();
          },
          error: (error: any) => {

            this.generalService.hideLoading();
            this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
          }
        });
      }
    })
  }

  editRole(role: Role) {

    this.dialog.open(ManageRoleDialogComponent, {
      width: '500px',
      data: {
        role: role,
        action: 'edit'
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'saved') {
        this.updateList();
      }
    })
  }

  /*
   * Private helper methods.
   */

  private updateList() {

    this.getRolesList.emit();
  }
}
