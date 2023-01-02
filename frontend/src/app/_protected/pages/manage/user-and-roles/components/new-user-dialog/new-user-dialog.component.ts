
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Role } from '../../_models/role.model';
import { User_Extra } from '../../_models/user.model';
import { RoleService } from '../../_services/role.service';
import { UserService } from '../../_services/user.service';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';

/**
 * Helper modal dialog for creating a new user
 */
@Component({
  selector: 'app-new-user-dialog',
  templateUrl: './new-user-dialog.component.html',
  styleUrls: ['./new-user-dialog.component.scss']
})
export class NewUserDialogComponent implements OnInit {

  showPassword: boolean = false;
  isLoading: boolean = false;
  data: Role[] = [];
  roleControl = new FormControl();

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

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
    name: [''],
    role: []
  })

  ngOnInit() {

    this.roleService.list('?limit=-1').subscribe({
      next: (roles: Role[]) => {
        this.data = roles;
        const guestExisting: any = this.data.find((item: Role) => item.name === 'guest');
        guestExisting ? this.userForm.patchValue({ role: ['guest'] }) : this.userForm.patchValue({ role: [this.data[0].name] })
        this.cdr.detectChanges();
      }
    });
  }

  createUser() {

    if (this.userForm.valid) {
      this.isLoading = true;
      this.userService.create(this.userForm.value.username, this.userForm.value.password).subscribe({
        next: (res: any) => {
          if (res) {

            const promises: Promise<any>[] = [];
            if (this.userForm.value.role.length) {
              for (const role of this.userForm.value.role) {
                promises.push(this.addRole(role));
              }
            }
            if (this.userForm.value.email) {
              promises.push(this.addEmail());
            }
            if (this.userForm.value.name) {
              promises.push(this.addName());
            }
            if (promises.length === 0) {
              this.generalService.showFeedback('User is created successfully', 'successMessage');
              this.dialogRef.close('done');
              this.isLoading = false;
              return;
            }
            forkJoin(promises).subscribe({
              next: () => {
                this.generalService.showFeedback('User is created successfully', 'successMessage');
                this.dialogRef.close('done');
                this.isLoading = false;
              },
              error: () => {
                this.generalService.showFeedback('Something went wrong', 'errorMessage', 'Ok');
              }
            });
          }
        },
        error: () => {
          this.isLoading = false;
          this.generalService.showFeedback('Username is already existing.', 'errorMessage', 'Ok', 4000);
        }
      })
    } else {
      this.generalService.showFeedback('Username and password are required.', 'errorMessage');
    }
  }

  /*
   * Private helper methods.
   */

  private addRole(role: string) {
    return new Promise<string>((resolve) => {
      this.userService.addRole(this.userForm.value.username, role).subscribe({
        next: (res: any) => {
          if (res.result === 'success') {
            resolve('ok')
          }
        },
        error: () => { resolve('error') }
      });
    });
  }

  private addEmail() {
    const data: User_Extra = {
      type: 'email',
      value: this.userForm.value.email,
      user: this.userForm.value.username
    };
    return new Promise<string>((resolve) => {
      this.userService.addExtra(data).subscribe({
        next: (res: any) => {
          if (res.result === 'success') {
            resolve('ok')
          }
        },
        error: () => { resolve('error') }
      })
      resolve('ok')
    })
  }

  private addName() {
    const data: User_Extra = {
      type: 'name',
      value: this.userForm.value.name,
      user: this.userForm.value.username
    };
    return new Promise<string>((resolve) => {
      this.userService.addExtra(data).subscribe({
        next: (res: any) => {
          if (res.result === 'success') {
            resolve('ok')
          }
        },
        error: () => { resolve('error') }
      })
      resolve('ok')
    });
  }
}
