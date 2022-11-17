import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Role } from '../../_models/role.model';
import { User } from '../../_models/user.model';
import { RoleService } from '../../_services/role.service';
import { UserService } from '../../_services/user.service';

@Component({
  selector: 'app-edit-user-dialog',
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.scss']
})
export class EditUserDialogComponent implements OnInit {

  /**
   * A form control for roles.
   */
  public rolesCtrl = new FormControl<any>([]);

  /**
   * Stores all the roles in a list.
   */
  public rolesList: any = [];

  /**
   * Setting a variable for the current state of the selected user.
   */
  public userIsLocked: boolean = undefined;

  public formData: any = [];
  roles: Role[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private roleService: RoleService,
    private generalService: GeneralService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { user: User }) { }

  /**
   * initialization of our dynamic form
   */
  public userForm = this.fb.group({});

  ngOnInit(): void {

    this.roleService.list('?limit=-1').subscribe({
      next: (roles: Role[]) => {
        this.roles = roles || [];
        for (const idx of (this.data.user.roles || [])) {
          this.rolesCtrl.value.push(idx);
        }
      },
    });

    (async () => {
      while (this.data && !Object.keys(this.data).length)
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.data && Object.keys(this.data).length > 0) {
        this.formData = this.data.user;
        this.setFormFields();

        this.sortRolesBySelected();
        this.userIsLocked = (this.data.user.locked === true);
      }
    })();
  }

  public sortRolesBySelected() {
    this.cdr.detectChanges();
  }

  setFormFields() {
    delete this.formData?.created;
    delete this.formData?.locked;
    for (const key in this.formData) {
      this.userForm.setControl(key, new FormControl(this.formData[key]));
    }
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
          this.generalService.showFeedback('Roles successfully updated.', 'successMessage');
        }
      },
      error: (error: any) => {
        this.generalService.showFeedback(error, 'errorMessage', 'ok', 4000);
      }
    });
  }

  public removeRole(item: any) {
    this.userService.removeRole(item.user, item.role).subscribe({
      next: (res: any) => {
        if (res && res.affected > 0) {
          this.generalService.showFeedback('Roles successfully updated.', 'successMessage');
        }
      },
      error: (error: any) => {
        this.generalService.showFeedback(error, 'errorMessage', 'ok', 4000);
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
          this.generalService.showFeedback(`User is ${this.userIsLocked ? 'LOCKED' : 'UNLOCKED'} successfully.`);
        }
      },
      error: (error: any) => {
        this.generalService.showFeedback(error, 'errorMessage', 'ok', 4000);
      }
    });
  }
}
