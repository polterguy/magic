
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GeneralService } from 'src/app/_general/services/general.service';
import { UserService } from 'src/app/_general/services/user.service';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { NavLinks } from './_model/nav-links';
import { Clipboard } from '@angular/cdk/clipboard';
import { Backend } from 'src/app/_protected/models/common/backend.model';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from 'src/app/_general/components/dialog/dialog.component';
import { BackendsListComponent } from 'src/app/_general/components/backends-list/backends-list.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  /**
   * Header's links.
   */
  public navLinks: NavLinks[] = [];

  /**
   * An instance for the list of permissions specified in the backendService.
   */
  private permissions: any = [];

  /**
   * Specifies if the user is authenticated towards the selected backend or now.
   */
  private hasToken: boolean = undefined;

  /**
   * Specifies if the user has a root role.
   */
  private isRoot: boolean = undefined;

  /**
   * Specifies the active backend's url.
   */
  public activeUrl: string = '';

  /**
   * Stores the list of backends.
   */
  public backendList: any = [];

  /**
   * a variable to define the sidebar status
   */
  public sideExpanded: boolean = false;

  public username: string = '';

  public isAffiliate: boolean = false;

   /**
    *
    * @param clipboard To copy URL of endpoint
    * @param generalService To provide feedback to user
    * @param userService
    * @param router To redirect user after having verified his authentication token
    * @param cdr To mark component as having changes
    * @param themeService To determine which theme we're using and to allow user to change theme
    * @param backendService To keep track of currently selected backend
    */
  constructor(
    private dialog: MatDialog,
    private clipboard: Clipboard,
    private generalService: GeneralService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private backendService: BackendService) {
    // this.username = this.userService.getUserData().username;
    // this.userService.getUserData()?.extra?.affiliate_percent ? this.isAffiliate = true : this.isAffiliate = false;
  }

  ngOnInit() {
    (async () => {
      while (this.backendService.active.access && !Object.keys(this.backendService.active.access.auth).length)
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.backendService.active.access && Object.keys(this.backendService.active.access.auth).length > 0) {
        this.permissions = this.backendService.active;
        this.username = this.permissions.token ? this.permissions.token['_username'] : 'anonymous';
        this.backendService.active ? this.activeUrl = this.backendService.active.url.replace('http://', '').replace('https://', '') : this.activeUrl = 'not connected';
        this.backendList = this.backendService.backends;

        this.createMenu();
        this.cdr.detectChanges();
      }
    })();
  }

  private createMenu() {
    this.navLinks = [
      {
        name: 'Dashboard',
        url: '/',
        expandable: false
      },
      {
        name: 'Administration',
        url: null,
        expandable: true,
        submenu: [
          {
            name: 'Users and roles',
            url: '/user-roles-management',
            disabled: !(this.permissions.access.auth.view_users && this.permissions.access.auth.view_roles && this.permissions.setupDone)
          },
          {
            name: 'Generated endpoints',
            url: '/generated-endpoints',
            disabled: !(this.permissions.access.endpoints.view && this.permissions.setupDone)
          },
          {
            name: 'Generated sockets',
            url: '/generate-sockets',
            disabled: !(this.permissions.access.sockets.read && this.permissions.setupDone)
          },
          {
            name: 'Generated frontend',
            url: '/generate-frontend',
            disabled: !(this.permissions.access.crud.generate_crud && this.permissions.access.crud.generate_sql && this.permissions.access.crud.generate_frontend && this.permissions.setupDone)
          },
        ],
      },
      {
        name: 'Tools',
        url: null,
        expandable: true,
        submenu: [
          {
            name: 'SQL studio',
            url: '/sql-studio',
            disabled: !(this.permissions.access.sql.execute_access && this.permissions.setupDone)
          },
          {
            name: 'CRUD generator',
            url: '/sql-studio',
            disabled: !(this.permissions.access.crud.generate_crud && this.permissions.access.crud.generate_sql && this.permissions.access.crud.generate_frontend && this.permissions.setupDone)
          },
          {
            name: 'Extra Modules',
            url: '/extra-modules',
            disabled: !(this.permissions.access.bazar.get_manifests && this.permissions.setupDone)
          },
          {
            name: 'Evaluator',
            url: '/evaluator',
            disabled: !(this.permissions.access.eval.execute && this.permissions.setupDone)
          },
          {
            name: 'Task scheduler',
            url: '/task-scheduler',
            disabled: !(this.permissions.access.tasks.read && this.permissions.setupDone)
          },
          {
            name: 'Hyper IDE',
            url: '/hyper-ide',
            disabled: !(this.permissions.access.files.list_files && this.permissions.access.files.list_folders && this.permissions.setupDone)
          }
        ],
      },
      {
        name: 'Settings & security',
        url: null,
        expandable: true,
        submenu: [
          {
            name: 'Config',
            url: '/configurations',
            disabled: !(this.permissions.access.config.load)
          },
          {
            name: 'Server keys setting',
            url: '/server-key-setting',
            disabled: !(this.permissions.access.crypto.import_public_key)
          },
          {
            name: 'Log',
            url: '/log',
            disabled: !(this.permissions.access.log.read && this.permissions.setupDone)
          },
          {
            name: 'Health check',
            url: '/health-check',
            disabled: !(this.permissions.access.log.read && this.permissions.setupDone)
          },
          {
            name: 'Cache',
            url: '/cache',
            disabled: !(this.permissions.access.log.read && this.permissions.setupDone)
          },
        ],
      },
      {
        name: this.username,
        url: null,
        expandable: true,
        submenu: [
          {
            name: 'Profile',
            url: '/user-profile',
            disabled: !(this.permissions.token)
          },
          {
            name: 'Help center',
            url: '/help-center'
          },
          {
            name: 'Logout',
            color: 'warn'
          }
        ],
      }
    ]
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
   * Logs the user out of his current backend.
   */
  public logout(clickType: string) {
    if (clickType !== 'Logout') {
      return;
    }
    this.backendService.logout(false);
    this.router.navigate(['/authentication']);
  }


  public viewBackends() {
    this.dialog.open(DialogComponent, {
      width: '80vw',
      maxWidth: '90vw',
      minHeight: '100px',
      autoFocus: false,
      data: {
        component: BackendsListComponent
      }
    })
  }
  // /**
  //  * Invoked when user wants to copy the full URL of the endpoint.
  //  */
  //  copyUrlWithBackend(url: string) {
  //   const currentURL = window.location.protocol + '//' + window.location.host;
  //   const param = currentURL + '?backend='
  //   this.clipboard.copy(param + encodeURIComponent(url));
  //   this.generalService.showFeedback('Backend URL was copied to your clipboard');
  // }

  // /**
  //  * Switching to specified backend.
  //  *
  //  * @param backend Backend to switch to
  //  */
  // switchBackend(backend: Backend) {
  //   this.backendService.activate(backend);
  //   this.router.navigate(['/']);
  // }

  // /**
  //  * Removes specified backend from local storage
  //  *
  //  * @param backend Backend to remove
  //  */
  // removeBackend(backend: Backend) {

  //   // For weird reasons the menu gets "stuck" unless we do this in a timer.
  //   setTimeout(() => this.backendService.remove(backend), 1);
  // }
}
