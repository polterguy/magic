
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';
import { GeneralService } from 'src/app/_general/services/general.service';
import { ThemeService } from 'src/app/_general/services/theme.service';
import { BackendService } from 'src/app/_general/services/backend.service';
import { UserService } from '../../manage/user-and-roles/_services/user.service';

/**
 * Profile component, allowing user to edit his or her profile.
 */
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  selectedTheme: string = null;
  user: any = {};
  password: string = '';
  confirmPassword: string = '';
  showPassword: boolean = false;
  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    private router: Router,
    public themeService: ThemeService,
    private userService: UserService,
    private backendService: BackendService,
    private generalService: GeneralService) { }

  ngOnInit() {
    this.getUsername();
  }

  save() {

    if (this.user.name === '') {
      this.generalService.showFeedback('Please provide a full name', 'errorMessage');
      return;
    }
    const data: any = {
      user: this.user.username,
      type: 'name',
      value: this.user.name
    }

    this.userService.editExtra(data).subscribe({
      next: () => {
        this.generalService.showFeedback('Details saved successfully', 'successMessage');
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')});
  }

  savePassword() {

    if (this.password === '') {
      this.generalService.showFeedback('Please provide a new password', 'errorMessage');
      return;
    }

    if (this.password.length < 12) {
      this.generalService.showFeedback('Not a valid password', 'errorMessage');
      return;
    }

    if (this.confirmPassword === '') {
      this.generalService.showFeedback('Please confirm the new password', 'errorMessage');
      return;
    }

    if (this.confirmPassword !== this.password) {
      this.generalService.showFeedback('Passwords do not match', 'errorMessage');
      return;
    }

    this.backendService.changePassword(this.password).subscribe({
      next: () => {
        this.generalService.showFeedback('Please sign in with your new password', 'successMessage', 'Ok', 5000);
        this.backendService.logout(false);
        this.router.navigate(['/authentication']);
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  /*
   * Private helper methods.
   */

  private getUsername() {
    this.user.username = this.backendService.active.token['_username'];
    this.getUser();
  }

  private getUser() {
    this.userService.list(`?username.like=${encodeURIComponent(this.user.username)}%`).subscribe({
      next: (res: any) => {
        if (res) {
          let user: any = {}
          res.map((item: any) => {
            if (item.extra) {
              item.extra.forEach((extra: any) => {
                user[extra.type] = extra.value
              });
              user.username = item.username
            }
          })
          this.user = user;
        }
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message, 'errorMessage')
    });
  }
}
