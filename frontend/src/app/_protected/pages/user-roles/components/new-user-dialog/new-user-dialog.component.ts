import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Role } from '../../_models/role.model';
import { User_Extra } from '../../_models/user.model';
import { RoleService } from '../../_services/role.service';
import { UserService } from '../../_services/user.service';

@Component({
  selector: 'app-new-user-dialog',
  templateUrl: './new-user-dialog.component.html',
  styleUrls: ['./new-user-dialog.component.scss']
})
export class NewUserDialogComponent implements OnInit {

  /**
   * Toggles the visibility of the given password.
   */
  public showPassword: boolean = false;

  /**
   * Sets to true when the process of creating a new user is started.
   */
  public isLoading: boolean = false;

  public data: Role[] = [];

  roleControl = new FormControl();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private roleService: RoleService,
    private dialogRef: MatDialogRef<NewUserDialogComponent>,
    private generalService: GeneralService) { }

  userForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    email: [''],
    role: []
  })

  ngOnInit(): void {
    this.roleService.list('?limit=-1').subscribe({
      next: (roles: Role[]) => {
        this.data = roles;
        const guestExisting: any = this.data.find((item: Role) => item.name === 'guest');
        guestExisting ? this.userForm.patchValue({role:['guest']}) : this.userForm.patchValue({role:[this.data[0].name]})
        this.cdr.detectChanges();
      }
    });
  }

  public createUser() {
    if (this.userForm.valid) {
      this.isLoading = true;
      this.userService.create(this.userForm.value.username, this.userForm.value.password).subscribe({
        next: (res: any) => {
          if (res) {

            if (this.userForm.value.role.length && this.userForm.value.email) {
              forkJoin([
                this.addRole(),
                this.addEmail()
              ]).subscribe((res: any) => {
                this.generalService.showFeedback('User is created successfully', 'successMessage');
                this.dialogRef.close('done');
                this.isLoading = false;
              })
            } else if (this.userForm.value.role.length && !this.userForm.value.email) {
              this.addRole().then((roleRes: string) => {
                this.generalService.showFeedback('User is created successfully', 'successMessage');
                this.dialogRef.close('done');
                this.isLoading = false;
              })
            } else if (this.userForm.value.email && !this.userForm.value.role.length) {
              this.addEmail().then((emailRes: string) => {
                this.generalService.showFeedback('User is created successfully', 'successMessage');
                this.dialogRef.close('done');
                this.isLoading = false;
              })
            }

            if (!this.userForm.value.role.length && !this.userForm.value.email) {
              this.generalService.showFeedback('User is created successfully', 'successMessage');
              this.dialogRef.close('done');
              this.isLoading = false;
            }
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          this.generalService.showFeedback('Username is already existing.', 'errorMessage', 'Ok', 4000);
        }
      })
    } else {
      this.generalService.showFeedback('Username and password are required.', 'errorMessage');
    }
  }

  private addRole() {
    return new Promise((resolve) => {
      this.userForm.value.role.forEach((element: any, index: number) => {
        this.userService.addRole(this.userForm.value.username, element).subscribe({
          next: (res: any) => {
            if (res.result === 'success') {
              resolve('ok')
            }
          },
          error: (error: any) => { resolve('error') }
        })
      });
    })
  }

  private addEmail() {
    const data: User_Extra = {
      type: 'email',
      value: this.userForm.value.email,
      user: this.userForm.value.username
    };
    return new Promise((resolve) => {
      this.userService.addExtra(data).subscribe({
        next: (res: any) => {
          if (res.result === 'success') {
            resolve('ok')
          }
        },
        error: (error: any) => { resolve('error') }
      })
      resolve('ok')
    })
  }


}
