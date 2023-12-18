
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Role } from '../../_models/role.model';
import { ManageRoleDialogComponent } from '../manage-role-dialog/manage-role-dialog.component';
import { NewUserDialogComponent } from '../new-user-dialog/new-user-dialog.component';

/**
 * Common helper component to allow user to filter for users or roles.
 */
@Component({
  selector: 'app-shared-top-bar',
  templateUrl: './shared-top-bar.component.html',
  styleUrls: ['./shared-top-bar.component.scss']
})
export class SharedTopBarComponent {

  private searchTerm: string = null;

  @Input() tab: string = 'user';
  @Input() rolesList: Role[] = [];
  @Output() getUsersList = new EventEmitter<any>();
  @Output() getRolesList = new EventEmitter<any>();

  constructor(private dialog: MatDialog) { }

  filterList(event: { searchKey: string }) {

    this.searchTerm = event.searchKey;
    if (this.tab === 'user') {
      this.getUsers();
    } else {
      this.getRoles();
    }
  }

  removeSearchTerm() {

    this.searchTerm = '';
    if (this.tab === 'user') {
      this.getUsers();
    } else {
      this.getRoles();
    }
  }

  createNewUser() {

    this.dialog.open(NewUserDialogComponent, {
      width: '700px',
      data: this.rolesList
    }).afterClosed().subscribe((result: string) => {
      if (result) {
        this.getUsersList.emit({});
      }
    });
  }

  createNewRole() {

    this.dialog.open(ManageRoleDialogComponent, {
      width: '500px',
      data: {
        action: 'new'
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'saved') {
        this.getRolesList.emit({});
      }
    })
  }

  /*
   * Private helper methods.
   */

  private getUsers() {

    this.getUsersList.emit({ search: this.searchTerm });
  }

  private getRoles() {

    this.getRolesList.emit({ search: this.searchTerm });
  }
}
