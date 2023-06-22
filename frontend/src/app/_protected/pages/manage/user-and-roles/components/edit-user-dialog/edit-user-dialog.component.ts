
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Role } from '../../_models/role.model';
import { User } from '../../_models/user.model';
import { RoleService } from '../../_services/role.service';
import { UserService } from '../../_services/user.service';
import { AddExtraFieldsDialogComponent } from '../add-extra-fields-dialog/add-extra-fields-dialog.component';

/**
 * Helper modal dialog to allow user to edit a single user.
 */
@Component({
  selector: 'app-edit-user-dialog',
  templateUrl: './edit-user-dialog.component.html'
})
export class EditUserDialogComponent implements OnInit {

  /**
   * A form control for roles.
   */
  public rolesCtrl = new FormControl<any>([]);

  /**
   * Stores all the roles in a list.
   */
  public rolesList: Role[] = [];

  /**
   * Setting a variable for the current state of the selected user.
   */
  public userIsLocked: boolean = undefined;

  public formData: any = [];

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<EditUserDialogComponent>,
    private userService: UserService,
    private roleService: RoleService,
    private generalService: GeneralService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { user: User }) { }

  /**
   * initialization of our dynamic form
   */
  public userForm = this.fb.group({});

  ngOnInit() {
    this.formData = this.data.user?.extra || [];
    this.setFormFields();
    this.sortRolesBySelected();
    this.userIsLocked = this.data.user.locked;
    this.getRolesList();
  }

  private getRolesList() {
    this.roleService.list('?limit=-1').subscribe({
      next: (roles: Role[]) => {
        this.rolesList = roles || [];
        this.rolesCtrl = new FormControl<string[] | null>(this.data.user.roles || []);
      }
    });
  }

  public sortRolesBySelected() {
    this.cdr.detectChanges();
  }

  setFormFields() {
    this.formData.forEach((element: any) => {
      this.userForm.setControl(element.type, new FormControl(element.value));
    });
  }

  manageRole(name: string) {
    this.rolesCtrl.disable();
    const value: boolean = (this.rolesCtrl.value.indexOf(name) > -1);
    const item: any = {
      user: this.data.user.username,
      role: name
    }
    if (value === true) {
      this.addRole(name);
    } else {
      this.removeRole(item);
    }
  }

  public addRole(role: string) {
    this.userService.addRole(this.data.user.username, role).subscribe({
      next: (res: any) => {
        if (res && res.result === 'success') {
          this.generalService.showFeedback('Roles successfully updated', 'successMessage');
          this.rolesCtrl.enable();
        }
      },
      error: (error: any) => {
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'ok', 4000);
        this.rolesCtrl.enable();
      }
    });
  }

  public removeRole(item: any) {
    this.userService.removeRole(item.user, item.role).subscribe({
      next: (res: any) => {
        if (res && res.affected > 0) {
          this.generalService.showFeedback('Roles successfully updated', 'successMessage');
          this.rolesCtrl.enable();
        }
      },
      error: (error: any) => {
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'ok', 4000);
        this.rolesCtrl.enable();
      }
    });
  }

  public toggleLockUser() {
    this.userIsLocked = !this.userIsLocked;
    const data: any = {
      username: this.data.user.username,
      locked: this.userIsLocked
    }
    this.userService.update(data).subscribe({
      next: (res: any) => {
        if (res && res.affected > 0) {
          this.generalService.showFeedback(`User was successfully ${this.userIsLocked ? 'locked' : 'unlocked'}`, 'successMessage');
        }
      },
      error: (error: any) => {
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'ok', 4000);
      }
    });
  }

  public addField() {
    this.dialog.open(AddExtraFieldsDialogComponent, {
      width: '450px',
      data: this.data.user.username
    }).afterClosed().subscribe((result: any) => {
      if (result) {
        this.formData.push({ type: result.type, value: result.value });
        this.setFormFields();
      }
    })
  }

  public deleteField(type: string) {
    const index: number = this.formData.findIndex((item: any) => item.type === type);
    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Delete field ${type ?? 'Empty'}`,
        description_extra: 'You are about to delete an extra field. This action cannot be undone and will be permanent.<br/><br/>Do you want to continue?',
        action_btn: 'Delete field',
        action_btn_color: 'warn',
        bold_description: true
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {
        this.userService.deleteExtra(type, this.data.user.username).subscribe({
          next: () => {
            this.formData.splice(index, 1);
            this.userForm.removeControl(type);
            this.generalService.showFeedback('The selected field is deleted successfully.', 'successMessage');
          },
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
        });
      }
    })
  }

  public saveFields() {
    let data = [];
    for (const key in this.userForm.value) {
      data.push(this.userService.editExtra({
        type: key,
        user: this.data.user.username,
        value: this.userForm.value[key]
      }))
    }
    if (data.length === 0) {
      this.dialogRef.close();
      return;
    }
    forkJoin(data).subscribe({
      next: () => {
        this.generalService.showFeedback('Changes are saved successfully.', 'successMessage');
        this.dialogRef.close();
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'ok', 4000)
    })
  }
}
