
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { forkJoin } from 'rxjs';
import { FormControl } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Application specific imports.
import { User } from 'src/app/models/user.model';
import { Role } from 'src/app/models/role.model';
import { BaseComponent } from '../../base.component';
import { Affected } from 'src/app/models/affected.model';
import { RoleService } from 'src/app/services/role.service';
import { UserService } from 'src/app/services/user.service';
import { AuthFilter } from 'src/app/models/auth-filter.model';
import { MessageService } from 'src/app/services/message.service';

/**
 * Roles component for administrating roles in the system.
 */
@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent extends BaseComponent implements OnInit {

  // Roles we're currently viewing details for.
  private selectedRoles: Role[] = [];

  /**
   * Data for roles table.
   */
  public roles: Role[] = [];

  /**
   * Filter for what items to display.
   */
  public filter: AuthFilter = {
    limit: 5,
    offset: 0,
    filter: '',
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
   * Creates an instance of your component.
   * 
   * @param roleService Used to retrieve all roles from backend
   * @param userService Used to associate a user with a role
   * @param messageService Message service to subscribe and publish messages to and from other components
   */
  constructor(
    private roleService: RoleService,
    private userService: UserService,
    protected messageService: MessageService) {
    super(messageService);
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
      .subscribe((query: string) => {
        this.getRoles(query);
      });

    // Retrieving roles from backend.
    this.getRoles(this.filterFormControl.value);
  }

  /**
   * Retrieves roles from your backend.
   */
  public getRoles(filter: string) {

    // Updating filter value.
    this.filter.filter = filter;

    // Invoking backend.
    this.roleService.list(this.filter).subscribe((roles: Role[]) => {

      // Assigning roles, triggering a re-render operation of the material table.
      this.roles = roles;

    }, (error: any) => this.showError(error));
  }

  /**
   * Clears any filters user has applied for the users table.
   */
  public clearRoleFilter() {
    this.filterFormControl.setValue('');
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
     * Creating multiple HTTP requests towards the backend to add role
     * to all users not belonging to the role from before.
     */
    const requests = this.selectedUsers
      .filter(x => x.roles.indexOf(role.name) === -1)
      .map(x => {
      return this.userService.addRole(x.username, role.name);
    });

    // Waiting for all requests to finish.
    forkJoin(requests).subscribe((affected: Affected[]) => {

      // Success, updating list of roles for all affected users.
      // No need to invoke backend here.
      for (const idx of this.selectedUsers.filter(x => x.roles.indexOf(role.name) === -1)) {
        idx.roles.push(role.name);
      }
    }, (error: any) => this.showError(error));
  }
}
