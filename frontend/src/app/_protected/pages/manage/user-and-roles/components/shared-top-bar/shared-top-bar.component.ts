
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { FileService } from 'src/app/_general/services/file.service';
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

  csvFileInput: any = null;

  constructor(
    private dialog: MatDialog,
    private fileService: FileService,
    private generalService: GeneralService) { }

  uploadUsers(files: any) {

    this.fileService.importUsers(files.item(0)).subscribe({
      next: (res: any) => {
        this.csvFileInput = null;
        this.getUsersList.emit({ search: this.searchTerm });
        this.generalService.showFeedback(`${res.count} users were successfully imported`);
      }, error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

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
