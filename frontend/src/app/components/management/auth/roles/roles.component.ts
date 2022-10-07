
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { forkJoin } from 'rxjs';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from '../../../../services/feedback.service';
import { User } from 'src/app/_protected/pages/user-roles/_models/user.model';
import { Role } from 'src/app/_protected/pages/user-roles/_models/role.model';
import { NewRoleDialogComponent } from './new-role-dialog/new-role-dialog.component';
import { RoleService } from 'src/app/_protected/pages/user-roles/_services/role.service';
import { UserService } from 'src/app/_protected/pages/user-roles/_services/user.service';
import { AuthFilter } from 'src/app/_protected/pages/user-roles/_models/auth-filter.model';

/**
 * Roles component for administrating roles in the system.
 */
@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('0.75s cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})
export class RolesComponent implements OnInit {

  /**
   * Data for roles table.
   */
  roles: Role[] = [];

  /**
   * Currently expanded element.
   */
  expandedElement: Role | null;

  /**
   * Number of roles matching filter in the backend.
   */
  count: number = 0;

  /**
   * Filter for what items to display.
   */
  filter: AuthFilter = {
    limit: 5,
    offset: 0,
    filter: '',
    order: 'name',
    direction: 'asc'
  };

  /**
   * What columns to display in table.
   */
  displayedColumns: string[] = [
    'name',
    'description',
  ];

  /**
   * Filter form control for filtering roles to display.
   */
  filterFormControl: FormControl;

  /**
   * Currently selected users.
   */
  @Input() selectedUsers: User[];

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  /**
   * Creates an instance of your component.
   *
   * @param feedbackService Used to provide feedback to user
   * @param dialog Used to open the create new role dialog
   * @param backendService Needed to retrieve user's access rights in backend
   * @param roleService Used to retrieve all roles from backend
   * @param userService Used to associate a user with a role
   */
  constructor(
    private feedbackService: FeedbackService,
    private dialog: MatDialog,
    public backendService: BackendService,
    private roleService: RoleService,
    private userService: UserService) {
  }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.paginator.pageIndex = 0;
        this.getRoles();
      });
    this.getRoles();
  }

  /**
   * Retrieves roles from your backend.
   */
  getRoles() {
    this.filter.filter = this.filterFormControl.value;
    this.filter.offset = this.paginator.pageIndex * this.paginator.pageSize;
    this.filter.limit = this.paginator.pageSize;
    this.roleService.list(this.filter).subscribe({
      next: (roles: Role[]) => this.roles = roles || [],
      error: (error: any) => this.feedbackService.showError(error)});
    this.roleService.count(this.filter).subscribe({
      next: (res: Count) => this.count = res.count,
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Clears any filters user has applied for the users table.
   */
  clearRoleFilter() {
    this.paginator.pageIndex = 0;
    this.filterFormControl.setValue('');
  }

  /**
   * Invoked when roles are paged.
   */
  paged() {
    this.getRoles();
  }

  /**
   * Allows the user to create a new role in the system.
   */
  createRole() {
    const dialogRef = this.dialog.open(NewRoleDialogComponent, {
      width: '550px',
    });
    dialogRef.afterClosed().subscribe((name: string) => {
      if (name) {
        this.feedbackService.showInfo(`'${name}' successfully created`);
        this.getRoles();
      }
    });
  }

  /**
   * Deletes the specified role.
   *
   * @param role Role to delete
   */
  deleteRole(role: Role) {
    this.roleService.countUsers(role.name).subscribe({
      next: (count: Count) => {
        if (count.count === 0) {
          this.roleService.delete(role.name).subscribe({
            next: () => {
              this.getRoles();
              this.feedbackService.showInfo(`Role '${role.name}' successfully deleted`);
            },
            error: (error: any) =>this.feedbackService.showError(error)});
        } else {
          this.feedbackService.confirm(
            'Please confirm operation',
            `Deleting the '${role.name}' role will affect ${count.count} users, you sure you want to delete this role?`,
            () => {
            this.roleService.delete(role.name).subscribe({
              next: () => {
                this.getRoles();
                this.feedbackService.showInfo(`Role '${role.name}' successfully deleted`);
                for (const idx of this.selectedUsers) {
                  const idxOfRole = idx.roles.indexOf(role.name);
                  if (idxOfRole !== -1) {
                    idx.roles.splice(idxOfRole, 1);
                  }
                }
              },
              error: (error: any) => this.feedbackService.showError(error)});
          });
        }
      },
      error: (error: any) =>this.feedbackService.showError(error)});
  }

  /**
   * Returns the number of users that are selected but does not belong to specified role.
   *
   * @param role Role to check for
   */
  getAffectedUsers(role: Role) {
    return this.selectedUsers.filter(x => !x.roles || x.roles.indexOf(role.name) === -1).length;
  }

  /**
   * Adds the specified role to all currently selected users,
   * unless user already belongs to the specified role.
   *
   * @param role Role to add to selected users
   */
  addRole(role: Role) {
    if (role.name === 'root') {
      this.feedbackService.confirm(
        'Please confirm action',
        `The root role is a special role in the system, and will give users complete access to do everything. Are you sure you want to associate the root role with ${this.getAffectedUsers(role)} users?`,
        () => {
          this.addRoleToSelectedUsers(role);
        });
    } else {
      this.addRoleToSelectedUsers(role);
    }
  }

  /**
   * Invoked when user wants to edit a specific role.
   *
   * @param role Role to edit
   */
  editRole(role: Role) {
    const dialogRef = this.dialog.open(NewRoleDialogComponent, {
      width: '550px',
      data: role
    });
    dialogRef.afterClosed().subscribe((name: string) => {
      if (name) {
        this.feedbackService.showInfo(`'${name}' successfully updated`)
        this.getRoles();
      }
    });
  }

  /*
   * Private helper methods.
   */

   /*
    * Adds the specified role to all selected users.
    */
  private addRoleToSelectedUsers(role: Role) {
    const requests = this.selectedUsers
      .filter(x => x.roles.indexOf(role.name) === -1)
      .map(x => this.userService.addRole(x.username, role.name));
    forkJoin(requests).subscribe({
      next: () => {
        this.feedbackService.showInfo(`Role '${role.name}' added to ${requests.length} users`)
        for (const idx of this.selectedUsers.filter(x => x.roles.indexOf(role.name) === -1)) {
          idx.roles.push(role.name);
        }
      },
      error: (error: any) => this.feedbackService.showError(error)});
   }
}
