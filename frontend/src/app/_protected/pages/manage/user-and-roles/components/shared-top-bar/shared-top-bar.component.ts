
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, ReplaySubject, debounceTime } from 'rxjs';
import { GeneralService } from 'src/app/_general/services/general.service';
import { FileService } from 'src/app/_protected/pages/create/hyper-ide/services/file.service';
import { Role } from '../../_models/role.model';
import { ManageRoleDialogComponent } from '../manage-role-dialog/manage-role-dialog.component';
import { NewUserDialogComponent } from '../new-user-dialog/new-user-dialog.component';

/**
 * Common helper component to allow user to filter for users or roles.
 */
@Component({
  selector: 'app-shared-top-bar',
  templateUrl: './shared-top-bar.component.html'
})
export class SharedTopBarComponent implements OnInit {

  @Input() tab: string = 'user';
  @Input() rolesList: Role[] = [];

  @Output() getUsersList = new EventEmitter<any>();
  @Output() getRolesList = new EventEmitter<any>();

  csvFileInput: any = null;

  /**
   * Stores the search input value.
   */
  searchTerm: string = '';

  /**
  * Specify if the user can create roles
  */
  public userCanCreateRole: boolean = undefined;

  /**
   * Specify if the user can create user
   */
  public userCanCreateUser: boolean = undefined;

  searchKeySubject: Subject<string> = new Subject<string>();
  private inputValue: ReplaySubject<string> = new ReplaySubject();

  constructor(
    private dialog: MatDialog,
    private fileService: FileService,
    private generalService: GeneralService,
    private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.watchSearchInputChanges();
  }

  uploadUsers(files: any) {
    this.fileService.importUsers(files.item(0)).subscribe({
      next: (res: any) => {
        this.csvFileInput = null;
        this.getUsersList.emit({ search: this.searchTerm });
        this.generalService.showFeedback(`${res.count} users were successfully imported`);
      }, error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  private watchSearchInputChanges() {
    this.inputValue.pipe(debounceTime(500)).subscribe((event: string) => {
      if (event.length > 2) {
        this.searchTerm = event;
        this.tab === 'user' ? this.getUsers() : this.getRoles();
      }
      if (event.length === 0) {
        this.removeSearchTerm();
      }
    })
  }

  /**
   * Invoking endpoint to search in unique fields.
   * @params event
   */
  public applyFilter(keyword: string) {
    this.inputValue.next(keyword);
  }

  /**
   * Removes the search keyword.
   * @callback getExportList To refetch the unfiltered list.
   */
  public removeSearchTerm() {
    this.searchTerm = '';
    this.tab === 'user' ? this.getUsers() : this.getRoles();
  }

  private getUsers() {
    this.getUsersList.emit({ search: this.searchTerm });
  }

  private getRoles() {
    this.getRolesList.emit({ search: this.searchTerm });
  }

  /**
   * Opens a dialog for creating a new user.
   */
  public createNewUser() {
    this.dialog.open(NewUserDialogComponent, {
      width: '700px',
      data: this.rolesList
    }).afterClosed().subscribe((result: string) => {
      if (result) {
        this.getUsersList.emit({});
      }
    })
  }

  /**
   * Opens a dialog for creating a new role.
   */
  public createNewRole() {
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
}
