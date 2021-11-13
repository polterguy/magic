
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

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { Affected } from 'src/app/models/affected.model';
import { User } from 'src/app/components/auth/models/user.model';
import { Role } from 'src/app/components/auth/models/role.model';
import { FeedbackService } from '../../../services/feedback.service';
import { RoleService } from 'src/app/components/auth/services/role.service';
import { UserService } from 'src/app/components/auth/services/user.service';
import { AuthFilter } from 'src/app/components/auth/models/auth-filter.model';
import { NewRoleDialogComponent } from './new-role-dialog/new-role-dialog.component';
import { AuthService } from '../services/auth.service';

/**
 * Roles component for administrating roles in the system.
 */
@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit {

  // Roles we're currently viewing details for.
  private selectedRoles: Role[] = [];

  /**
   * Data for roles table.
   */
  public roles: Role[] = [];

  /**
   * Number of roles matching filter in the backend.
   */
  public count: number = 0;

  /**
   * Filter for what items to display.
   */
  public filter: AuthFilter = {
    limit: 5,
    offset: 0,
    filter: '',
    order: 'name',
    direction: 'asc'
  };

  /**
   * What columns to display in table.
   */
  public displayedColumns: string[] = [
    'name',
    'description',
  ];

  /**
   * Filter form control for filtering roles to display.
   */
  public filterFormControl: FormControl;

  /**
   * Currently selected users.
   */
  @Input() public selectedUsers: User[];

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatPaginator, {static: true}) public paginator: MatPaginator;

  /**
   * Creates an instance of your component.
   * 
   * @param feedbackService Used to provide feedback to user
   * @param dialog Used to open the create new role dialog
   * @param authService Needed to verify user has access to component
   * @param roleService Used to retrieve all roles from backend
   * @param userService Used to associate a user with a role
   */
  constructor(
    private feedbackService: FeedbackService,
    private dialog: MatDialog,
    public authService: AuthService,
    private roleService: RoleService,
    private userService: UserService) {
  }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Creating our filtering control.
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.paginator.pageIndex = 0;
        this.getRoles();
      });

    // Retrieving roles from backend.
    this.getRoles();
  }

  /**
   * Retrieves roles from your backend.
   */
  public getRoles() {

    // Updating filter value.
    this.filter.filter = this.filterFormControl.value;
    this.filter.offset = this.paginator.pageIndex * this.paginator.pageSize;
    this.filter.limit = this.paginator.pageSize;

    // Invoking backend.
    this.roleService.list(this.filter).subscribe((roles: Role[]) => {

      // Resetting selected roles.
      this.selectedRoles = [];

      // Assigning model to result of backend invocation.
      this.roles = roles || [];

    }, (error: any) => this.feedbackService.showError(error));

    // Invoking backend to retrieve count of user matching filter condition.
    this.roleService.count(this.filter).subscribe((res: Count) => {

      // Assinging model to result of backend invocation.
      this.count = res.count;

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Clears any filters user has applied for the users table.
   */
  public clearRoleFilter() {

    // Resetting the page index and the filter form control will re-databind our table.
    this.paginator.pageIndex = 0;
    this.filterFormControl.setValue('');
  }

  /**
   * Invoked when roles are paged.
   */
  public paged() {

    // Since the paginator's value is used directly when retrieving roles, we can simply retrieve the roles here.
    this.getRoles();
  }

  /**
   * Allows the user to create a new role in the system.
   */
  public createRole() {

    // Showing modal dialog.
    const dialogRef = this.dialog.open(NewRoleDialogComponent, {
      width: '550px',
    });

    dialogRef.afterClosed().subscribe((name: string) => {

      // Checking if modal dialog wants to create a user.
      if (name) {

        // User was created.
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
  public deleteRole(role: Role) {

    // Invoking backend to check how many afffected users we'll have
    this.roleService.countUsers(role.name).subscribe((count: Count) => {

      if (count.count === 0) {

        // If no users are affected by operation we delete role immediately.
        this.roleService.delete(role.name).subscribe((affected: Affected) => {

          // Success! Informing user and retrieving roles again.
          this.getRoles();
          this.feedbackService.showInfo(`Role '${role.name}' successfully deleted`);
        });

      } else {

        // If one or more users are affected we warn user, and asks him to confirm operation.
        this.feedbackService.confirm(
          'Please confirm operation',
          `Deleting the '${role.name}' role will affect ${count.count} users, you sure you want to delete this role?`,
          () => {

          // Role deletion was confirmed.
          this.roleService.delete(role.name).subscribe((affected: Affected) => {

            // Success! Informing user and retrieving roles again.
            this.getRoles();
            this.feedbackService.showInfo(`Role '${role.name}' successfully deleted`);

            // Updating selected users, no need to invoke backend.
            for (const idx of this.selectedUsers) {
              const idxOfRole = idx.roles.indexOf(role.name);
              if (idxOfRole !== -1) {
                idx.roles.splice(idxOfRole, 1);
              }
            }
          }, (error: any) => this.feedbackService.showError(error));
        });
      }
    });
  }

  /**
   * Toggles the details view for a single role.
   * 
   * @param role Role to toggle details for
   */
  public toggleDetails(role: Role) {

    // Checking if we're already displaying details for current item.
    const idx = this.selectedRoles.indexOf(role);
    if (idx !== -1) {

      // Hiding item.
      this.selectedRoles.splice(idx, 1);
    } else {

      // Displaying item.
      this.selectedRoles.push(role);
    }
  }

  /**
   * Returns true if we should display the details view for specified role.
   * 
   * @param role Role to check if we should display details for
   */
  public shouldDisplayDetails(role: Role) {

    // Returns true if we're currently displaying this particular item.
    return this.selectedRoles.filter(x => x.name === role.name).length > 0;
  }

  /**
   * Returns the number of users that are selected but does not belong to specified role.
   * 
   * @param role Role to check for
   */
  public getAffectedUsers(role: Role) {
    return this.selectedUsers.filter(x => !x.roles || x.roles.indexOf(role.name) === -1).length;
  }

  /**
   * Adds the specified role to all currently selected users,
   * unless user already belongs to the specified role.
   * 
   * @param role Role to add to selected users
   */
  public addRole(role: Role) {

    /*
     * Checking if the role user tries to associate with the selected users is the root role,
     * at which point we warn him before we complete his request.
     */
    if (role.name === 'root') {
      
      // Asking user to confirm action, since this is the root role.
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
  public editRole(role: Role) {

    // Showing modal dialog.
    const dialogRef = this.dialog.open(NewRoleDialogComponent, {
      width: '550px',
      data: role
    });

    dialogRef.afterClosed().subscribe((name: string) => {

      // Checking if modal dialog wants to create a user.
      if (name) {

        // User was created.
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

    /*
     * Creating multiple HTTP requests towards the backend to add role
     * to all users not belonging to the role from before.
     */
    const requests = this.selectedUsers
      .filter(x => x.roles.indexOf(role.name) === -1)
      .map(x => {
      return this.userService.addRole(x.username, role.name);
    });

    // Waiting for all requests to finish.
    forkJoin(requests).subscribe(() => {

      // Success, updating list of roles for all affected users.
      // No need to invoke backend here.
      this.feedbackService.showInfo(`Role '${role.name}' added to ${requests.length} users`)
      for (const idx of this.selectedUsers.filter(x => x.roles.indexOf(role.name) === -1)) {
        idx.roles.push(role.name);
      }
    }, (error: any) => this.feedbackService.showError(error));
   }
}
