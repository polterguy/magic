
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { BehaviorSubject } from 'rxjs';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Role } from './_models/role.model';
import { User } from './_models/user.model';
import { RoleService } from './_services/role.service';
import { UserService } from './_services/user.service';

/**
 * Helper component allowing user to edit and manage his or her roles and users in the system.
 */
@Component({
  selector: 'app-user-roles',
  templateUrl: './user-roles.component.html'
})
export class UserRolesComponent implements OnInit {

  private usersCount: number = 0;
  private rolesCount: number = 0;
  private filter: string = null;

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;

  isLoading: boolean = true;
  users = new BehaviorSubject<User[] | null>([]);
  roles = new BehaviorSubject<Role[]>([]);
  resultsLength: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 100];
  currentPage: number = 0;
  pageEvent!: PageEvent;

  constructor(
    private userService: UserService,
    private generalService: GeneralService,
    private roleService: RoleService) { }

  ngOnInit() {

    this.getUsersList();
  }

  tabChange(event: MatTabChangeEvent) {

    if (event.index === 0) {

      this.getUsersList();

    } else {

      this.getRolesList();

    }
  }

  getUsersList(event?: { search: string }) {

    if (event) {
      this.paginator.pageIndex = 0;
      this.currentPage = 0;
    }
    let param: string = `?limit=${this.pageSize}&offset=${this.currentPage}`;
    if (event) {
      this.filter = event.search;
    }
    if (this.filter) {
      param += `&username.like=%${encodeURIComponent(this.filter)}%`;
    }

    this.generalService.showLoading();
    this.userService.list(param).subscribe({
      next: (res: User[]) => {

        this.users.next(res || []);

        if (res) {

          this.countUser();

        } else {

          this.resultsLength = 0;
          this.generalService.hideLoading();
        }
      },
      error: () => {

        this.generalService.showFeedback('Something went wrong as we tried to retrieve users', 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  getRolesList(event?: { search: string }) {

    if (event) {
      this.paginator.pageIndex = 0;
      this.currentPage = 0;
    }
    let param: string = `?limit=${this.pageSize}&offset=${this.currentPage}`;
    if (event) {
      this.filter = event.search;
    }
    if (this.filter) {
      param += `&name.like=%${encodeURIComponent(this.filter)}%`;
    }

    this.generalService.showLoading();
    this.roleService.list(param).subscribe({
      next: (res: Role[]) => {

        this.roles.next(res || []);

        if (res) {

          this.countRole();

        } else {

          this.resultsLength = 0;
          this.generalService.hideLoading();
        }
      },
      error: () => {

        this.generalService.showFeedback('Something went wrong as we tried to retrieve roles', 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  pageChange(event: PageEvent, activeTabIndex?: number) {

    this.isLoading = true;
    this.pageEvent = event;
    this.currentPage = event.pageIndex * this.pageSize;
    this.pageSize = event.pageSize;
    activeTabIndex === 0 ? this.getUsersList() : this.getRolesList();
  }

  /*
   * Private helper methods.
   */

  private countUser() {

    const param: string = `${this.filter ? `?username.like=%${encodeURIComponent(this.filter)}%` : ''}`;

    this.userService.count(param).subscribe({
      next: (res: any) => {

        if (res) {
          this.resultsLength = res.count;
          this.usersCount = res.count;
        }
        this.isLoading = false;
        this.generalService.hideLoading();
      },
      error: () => {

        this.generalService.hideLoading();
      }
    });
  }

  private countRole() {

    const param: string = `${this.filter ? `?name.like=${encodeURIComponent(this.filter)}%` : ''}`;
    this.roleService.count(param).subscribe({
      next: (res: any) => {

        if (res) {

          this.resultsLength = res.count
          this.rolesCount = res.count;
        }
        this.isLoading = false;
        this.generalService.hideLoading();

      },
      error: () => {

        this.generalService.hideLoading();
      }
    });
  }
}
