import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { UserService } from '../../user-roles/_services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  public user: any = {};

  public password: string = '';
  public confirmPassword: string = '';
  public showPassword: boolean = false;

  public CommonRegEx = CommonRegEx;
  public CommonErrorMessages = CommonErrorMessages;

  constructor(
    private router: Router,
    private userService: UserService,
    private backendService: BackendService,
    private generalService: GeneralService) { }

  ngOnInit(): void {
    this.getUsername();
  }

  private getUsername() {
    (async () => {
      while (this.backendService.active.access && !Object.keys(this.backendService.active.access.auth).length)
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.backendService.active.access && Object.keys(this.backendService.active.access.auth).length > 0) {
        this.user.username = this.backendService.active.token['_username'];
        this.getUser();
      }
    })();
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
      error: (error: any) => {}
    })
  }

  public save() {
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
      next: (res: any) => {
        this.generalService.showFeedback('Details saved successfully', 'successMessage');
      },
      error: (error: any) => {
        this.generalService.showFeedback(error?.error?.message??error, 'errorMessage');
      }
    })
  }

  /**
   * Invoked when user wants to change his password.
   */
  public savePassword() {
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
      error: (error: any) => this.generalService.showFeedback(error?.error?.message??error, 'errorMessage')});
  }
}
