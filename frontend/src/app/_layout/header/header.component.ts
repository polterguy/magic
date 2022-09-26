
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/_general/services/auth.service';
import { GneralNotificationService } from 'src/app/_general/services/notification.service';
import { UserService } from 'src/app/_general/services/user.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  /**
   * a variable to define the sidebar status
   */
  public sideExpanded: boolean = false;

  public username: string = '';

  public isAffiliate: boolean = false;

  public notificationList: any = [];

  public hasUnhandledNotifications: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private gneralNotificationService: GneralNotificationService) {
    this.username = this.userService.getUserData().username;
    this.userService.getUserData()?.extra?.affiliate_percent ? this.isAffiliate = true : this.isAffiliate = false;
  }

  ngOnInit() {
    this.gneralNotificationService.getNotifications();
    this.getNotifications();
  }

  public getNotifications() {
    this.cdr.markForCheck();
    this.gneralNotificationService.notificationList.subscribe((res: any) => {
      this.notificationList = res;
    });
    this.cdr.detectChanges();
  }

  /**
   * changing status of the sidebar
   */
  public toggleSidebar() {
    this.sideExpanded = !this.sideExpanded;
  }

  public closeSidebarInSidePanel() {
    if (!this.sideExpanded) {
      return;
    }
    this.toggleSidebar();
  }

  /**
   * removing token from the session storage
   */
  public logout() {
    this.authService.setJwtToken();
    this.userService.setUserData();
    this.router.navigate(['authentication']);
    sessionStorage.clear();
  }
}
