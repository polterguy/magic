
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from 'src/app/_general/services/backend.service';
import { NavLinks } from './_model/nav-links';
import { Backend } from 'src/app/_protected/models/common/backend.model';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from 'src/app/_general/components/dialog/dialog.component';
import { BackendsListComponent } from 'src/app/_general/components/backends-list/backends-list.component';
import { GithubTokenDialogComponent } from 'src/app/_protected/pages/user/github-token-dialog/github-token-dialog.component';
import { Status } from 'src/app/_protected/models/common/status.model';

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

  public waitingSetupStatus: boolean = true;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private backendService: BackendService) {

  }

  ngOnInit() {
    this.getPermissions();
  }

  public getPermissions() {
    if ((this.backendService?.active?.access && Object.keys(this.backendService?.active?.access?.auth).length > 0)) {
      this.permissions = this.backendService.active;
      this.username = this.permissions.token ? this.permissions.token['_username'] : 'anonymous';
      this.backendService.active ? this.activeUrl = this.backendService.active.url.replace('http://', '').replace('https://', '') : this.activeUrl = 'not connected';
      this.backendList = this.backendService.backends;

      const notAuthorized: boolean = (!this.backendService.active || Object.values(this.backendService.active.access.auth ?? {}).every((item: any) => { return item === false }))

      if (notAuthorized || this.backendService.active.token === null) {
        this.router.navigate(['/authentication/login']);
      }

      this.createMenu();
      this.getSetupStatus();

    } else {
      const notAuthorized: boolean = (!this.backendService.active || Object.values(this.backendService.active.access.auth ?? {}).every((item: any) => { return item === false }))
      if (notAuthorized || this.backendService.active.token === null) {
        this.router.navigate(['/authentication/login']);
      }
    }
  }

  private createMenu() {
    this.navLinks = [
      {
        name: 'Dashboard',
        url: '/',
        expandable: false,
        exact: true,
      },
      {
        name: 'Create',
        url: null,
        expandable: true,
        exact: false,
        submenu: [
          {
            name: 'Databases',
            url: '/databases',
            disabled: !(this.permissions.access.sql.execute_access && this.permissions.setupDone),
            exact: false,
          },
          {
            name: 'SQL Studio',
            url: '/sql-studio',
            disabled: !(this.permissions.access.endpoints.view && this.permissions.setupDone),
            exact: false,
          },
          {
            name: 'Endpoint Generator',
            url: '/endpoint-generator',
            disabled: !(this.permissions.access.crud.generate_crud && this.permissions.access.crud.generate_sql && this.permissions.access.crud.generate_frontend && this.permissions.setupDone),
            exact: false,
          },
          {
            name: 'Frontend Generator',
            url: '/frontend-generator',
            disabled: !(this.permissions.access.crud.generate_crud && this.permissions.access.crud.generate_sql && this.permissions.access.crud.generate_frontend && this.permissions.setupDone),
            exact: false,
          },
          {
            name: 'Hyper IDE',
            url: '/hyper-ide',
            disabled: !(this.permissions.access.files.list_files && this.permissions.access.files.list_folders && this.permissions.setupDone),
            exact: false,
          },
          {
            name: 'Frontend IDE',
            url: '/frontend-ide',
            disabled: !(this.permissions.access.crud.generate_crud && this.permissions.access.crud.generate_sql && this.permissions.access.crud.generate_frontend && this.permissions.setupDone),
            exact: false,
          },
        ],
      },
      {
        name: 'Manage',
        url: null,
        expandable: true,
        exact: false,
        submenu: [
          {
            name: 'Users & roles',
            url: '/user-roles-management',
            disabled: !(this.permissions.access.auth.view_users && this.permissions.access.auth.view_roles && this.permissions.setupDone),
            exact: false,
          },
          {
            name: 'Endpoints',
            url: '/endpoints',
            disabled: !(this.permissions.access.endpoints.view && this.permissions.setupDone),
            exact: false,
          },
          {
            name: 'Tasks',
            url: '/tasks',
            disabled: !(this.permissions.access.tasks.read && this.permissions.setupDone),
            exact: false,
          },
          {
            name: 'Hyperlambda Playground',
            url: '/hyperlambda-playground',
            disabled: !(this.permissions.access.eval.execute && this.permissions.setupDone),
            exact: false,
          },
          {
            name: 'Sockets',
            url: '/sockets',
            disabled: !(this.permissions.access.sockets.read && this.permissions.setupDone),
            exact: false,
          },
          {
            name: 'Plugins',
            url: '/plugins',
            disabled: !(this.permissions.access.bazar.get_manifests && this.permissions.setupDone),
            exact: false,
          },
        ],
      },
      {
        name: 'Misc',
        url: null,
        expandable: true,
        exact: false,
        submenu: [
          {
            name: 'Configuration',
            url: '/configuration',
            disabled: !(this.permissions.access.config.load),
            exact: false,
          },
          {
            name: 'Health Check',
            url: '/endpoints-health-check',
            disabled: !(this.permissions.access.log.read && this.permissions.setupDone),
            exact: false,
          },
          {
            name: 'Log',
            url: '/log',
            disabled: !(this.permissions.access.log.read && this.permissions.setupDone),
            exact: false,
          },
          {
            name: 'Help Center',
            url: '/help-center',
            exact: false,
          },
        ],
      },
      {
        name: this.username,
        url: null,
        expandable: true,
        exact: false,
        submenu: [
          {
            name: 'Profile',
            url: '/user-profile',
            disabled: !(this.permissions.token),
            exact: false,
          },
          {
            name: 'Cryptography',
            url: '/server-key-setting',
            disabled: !(this.permissions.access.crypto.import_public_key),
            exact: false,
          },
          {
            name: 'Generate Token',
          },
          {
            name: 'Logout',
          }
        ],
      }
    ];
    this.checkActiveLink(this.router.url);
  }

  /**
   * To set the active link visually.
   * @param currentUrl active nav item's url.
   */
  public checkActiveLink(currentUrl: string) {
    this.navLinks.forEach((item: any) => {
      if (item.submenu) {
        item.isActive = item.submenu.findIndex((el: any) => (currentUrl || '').startsWith(el.url)) > -1;
      }
    })
  }

  /**
   * changing status of the sidebar
   */
  public toggleSidebar() {
    this.sideExpanded = !this.sideExpanded;
  }

  public closeSidebarInSidePanel(currentUrl: string) {
    this.checkActiveLink(currentUrl)
    if (!this.sideExpanded) {
      return;
    }
    this.toggleSidebar();
  }

  /**
   * Logs the user out of his current backend.
   */
  public getGithubToken(clickType: string) {
    if (clickType !== 'Generate Token') {
      return;
    }

    this.dialog.open(GithubTokenDialogComponent, {
      width: '500px',
      autoFocus: false,
      data: {
        username: this.username,
        role: this.permissions.token['_roles'].toString(),
        expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
      }
    })
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

  private getSetupStatus() {

    // Subscribing to status changes and redirect accordingly if we need user to setup system.
    this.backendService.statusRetrieved.subscribe((status: Status) => {
      if (status) {
        this.waitingSetupStatus = false;
        if (!status.result) {
          this.router.navigate(['/setup']);
        }
      }
    });
  }
}
