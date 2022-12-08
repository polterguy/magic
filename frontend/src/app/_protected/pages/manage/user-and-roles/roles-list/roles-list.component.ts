
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { ManageRoleDialogComponent } from '../components/manage-role-dialog/manage-role-dialog.component';
import { Role } from '../_models/role.model';
import { RoleService } from '../_services/role.service';

@Component({
  selector: 'app-roles-list',
  templateUrl: './roles-list.component.html',
  styleUrls: ['./roles-list.component.scss']
})
export class RolesListComponent implements OnInit {

  @Input() rolesList: any = [];
  @Input() accessPermissions: any = [];

  @Output() getRolesList = new EventEmitter<any>();

  displayedColumns: string[] = ['name', 'description', 'actions'];

  /**
   * Specify if the user can update roles
   */
  public userCanUpdate: boolean = undefined;

  /**
  * Specify if the user can delete roles
  */
  public userCanDelete: boolean = undefined;

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private roleService: RoleService,
    private generalService: GeneralService) { }

  ngOnInit(): void {
    (async () => {
      while (this.accessPermissions && this.accessPermissions.length === 0)
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.accessPermissions && Object.keys(this.accessPermissions.auth).length > 0) {
        this.userCanUpdate = this.accessPermissions.auth.update_role;
        this.userCanDelete = this.accessPermissions.auth.delete_role;

        this.cdr.detectChanges();
      }
    })();
  }

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

  /**
   * Deleting the selected role upon confirmation.
   * @param role Selected role.
   */
  public deleteRole(role: Role) {
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
        this.roleService.delete(role.name).subscribe({
          next: () => {
            this.generalService.showFeedback(`${role.name} was successfully deleted`, 'successMessage', 'Ok', 4000);
            this.updateList({});
          },
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
        });
      }
    })
  }

  public editRole(role: Role) {
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

  private updateList(obj: any = undefined) {
    this.getRolesList.emit(obj);
  }
}
