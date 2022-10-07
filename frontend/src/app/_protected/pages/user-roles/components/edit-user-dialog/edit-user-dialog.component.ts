import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Role } from '../../_models/role.model';
import { User } from '../../_models/user.model';
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

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private dialogRef: MatDialogRef<EditUserDialogComponent>,
    private generalService: GeneralService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { user: User, roles: Role[] }) { }

  /**
 * initialization of our dynamic form
 */
  public userForm = this.fb.group({});

  ngOnInit(): void {

    (async () => {
      while (this.data && !Object.keys(this.data).length)
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.data && Object.keys(this.data).length > 0) {
        this.formData = this.data.user;
        this.setFormFields();

        this.sortRolesBySelected();
        // this.rolesCtrl.setValue(this.data.user.role);
        this.userIsLocked = (this.data.user.locked === true);
      }
    })();
  }

  /**
   * Sorts roles' list in a way to have all selected roles listed on top of the list.
   * @param item Role set in the previous step.
   */
   public sortRolesBySelected() {
    // this.data.roles = this.data.roles.sort((a: any, b: any) => this.data.user.role.indexOf(b.name) - this.data.user.role.indexOf(a.name));
    this.cdr.detectChanges();
  }

  /**
   * Sets dynamic fields based on the existing data.
   * Sets all fields to disable, if the action is not equal to 'edit'
   */
  setFormFields() {
    delete this.formData?.created;
    delete this.formData?.locked;
    for (const key in this.formData) {
      this.userForm.setControl(key, new FormControl(this.formData[key]));
    }
  }


  /**
   * Setting the Role object and deciding what action needs to be made.
   * @param name user's username.
   */
   manageRole(name: string) {
    this.rolesCtrl.disable();
    const value: boolean = (this.rolesCtrl.value.indexOf(name) > -1);
    const item: any = {
      user: this.data.user.username,
      role: name
    }
    if (value === true) {
      this.addRole(item);
    } else {
      this.removeRole(item);
    }
  }

  /**
   * Invokes the endpoint to add a role to the user's roles.
   * @param item Role set in the previous step.
   */
  public addRole(item: any) {
    this.userService.addRole(item.user, item.name).subscribe({
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

  /**
   * Invokes the endpoint to remove a role from the user's roles.
   * @param item Role set in the previous step.
   */
  public removeRole(item: any) {
    this.userService.removeRole(item.role, item.user).subscribe({
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

  /**
   * Invokes the endpoint to lock/unlock user.
   */
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
