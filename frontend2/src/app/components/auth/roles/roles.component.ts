
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { Role } from 'src/app/models/role.model';
import { BaseComponent } from '../../base.component';
import { RoleService } from 'src/app/services/role.service';
import { AuthFilter } from 'src/app/models/auth-filter.model';
import { MessageService } from 'src/app/services/message.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

/**
 * Roles component for administrating roles in the system.
 */
@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent extends BaseComponent implements OnInit {

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
   * Creates an instance of your component.
   * 
   * @param messageService Message service to subscribe and publish messages to and from other components
   */
  constructor(
    private roleService: RoleService,
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
}
