
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
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
    private activatedRoute: ActivatedRoute,
    private backendService: BackendService) {

  }

  ngOnInit(): void {
    this.activatedRoute.queryParamMap.subscribe((params: any) => {
      if (params && params.keys && params.keys.length > 0) {
        this.getParams(params)
      } else {
        this.getPermissions();
      }
    })
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

  /*
   * Retrieving URL parameter
   */
  private getParams(params: any) {

    // Checking if user accessed system with a link containing query param pointing to specific backend.
    const backend = params.params['backend'];
    if (backend) {
      const cur = new Backend(backend);

      // Making sure we keep existing username, password and token, if we have these values.
      const old = this.backendService.backends.filter(x => x.url === cur.url);
      if (old.length > 0) {
        cur.username = old[0].username;
        cur.password = old[0].password;
        cur.token = old[0].token;
      }
      this.backendService.activate(cur);
      this.backendService.upsert(cur);

      if (cur.token === null) {
        this.router.navigate(['/authentication/login/'], {
          queryParamsHandling: 'preserve'
        });
      } else {
        window.location.href = '/';
      }

    } else {

      // Checking if user has some sort of token, implying reset-password token or verify-email token.
      const token = params.params['token'];
      if (token && token.includes('.')) {

        /*
         * 'token' query parameter seems to be a JWT token.
         *
         * Authentication request, authenticating using specified link,
         * and redirecting user to hide URL.
         */
        const url = params.params['url'];
        const username = params.params['username'];
        const backend = new Backend(url, username, null, token);
        this.backendService.upsert(backend);
        this.backendService.activate(backend);
        this.backendService.verifyToken().subscribe({
          next: () => {

            // this.feedbackService.showInfo(`You were successfully authenticated as '${username}'`);

            // Checking if this is an impersonation request or a change-password request.
            if (this.backendService.active.token.in_role('reset-password')) {

              // Change password request.
              this.router.navigate(['/change-password']);

            } else {

              // Impersonation request.
              // this.location.replaceState('');
              window.location.href = '/';
              this.getPermissions();
            }
          },
          error: (error: any) => { }
        });

      } else if (token) {

        /*
         * 'token' seems to be a "verify email address" type of token since it doesn't contain "." characters.
         *
         * Need to set the current backend first.
         */
        const backend = new Backend(params.params['url'], params.params['username']);
        this.backendService.upsert(backend);
        this.backendService.activate(backend);
        this.getPermissions();
      } else {
        this.getPermissions();
      }
    }
  }

  private createMenu() {
    this.navLinks = [
      {
        name: 'Dashboard',
        url: '/',
        expandable: false
      },
      {
        name: 'Create',
        url: null,
        expandable: true,
        submenu: [
          {
            name: 'Databases',
            url: '/databases',
            disabled: !(this.permissions.access.sql.execute_access && this.permissions.setupDone)
          },
          {
            name: 'SQL Studio',
            url: '/sql-studio',
            disabled: !(this.permissions.access.endpoints.view && this.permissions.setupDone)
          },
          {
            name: 'Endpoint Generator',
            url: '/endpoint-generator',
            disabled: !(this.permissions.access.crud.generate_crud && this.permissions.access.crud.generate_sql && this.permissions.access.crud.generate_frontend && this.permissions.setupDone)
          },
          {
            name: 'Frontend Generator',
            url: '/frontend-generator',
            disabled: !(this.permissions.access.crud.generate_crud && this.permissions.access.crud.generate_sql && this.permissions.access.crud.generate_frontend && this.permissions.setupDone)
          },
          {
            name: 'Hyper IDE',
            url: '/hyper-ide',
            disabled: !(this.permissions.access.files.list_files && this.permissions.access.files.list_folders && this.permissions.setupDone)
          },
          {
            name: 'Frontend IDE',
            url: '/frontend-ide',
            disabled: !(this.permissions.access.crud.generate_crud && this.permissions.access.crud.generate_sql && this.permissions.access.crud.generate_frontend && this.permissions.setupDone)
          },
        ],
      },
      {
        name: 'Manage',
        url: null,
        expandable: true,
        submenu: [
          {
            name: 'Users & roles',
            url: '/user-roles-management',
            disabled: !(this.permissions.access.auth.view_users && this.permissions.access.auth.view_roles && this.permissions.setupDone)
          },
          {
            name: 'Endpoints',
            url: '/endpoints',
            disabled: !(this.permissions.access.endpoints.view && this.permissions.setupDone)
          },
          {
            name: 'Tasks',
            url: '/tasks',
            disabled: !(this.permissions.access.tasks.read && this.permissions.setupDone)
          },
          {
            name: 'Hyperlambda Playground',
            url: '/hyperlambda-playground',
            disabled: !(this.permissions.access.eval.execute && this.permissions.setupDone)
          },
          {
            name: 'Sockets',
            url: '/sockets',
            disabled: !(this.permissions.access.sockets.read && this.permissions.setupDone)
          },
          {
            name: 'Plugins',
            url: '/plugins',
            disabled: !(this.permissions.access.bazar.get_manifests && this.permissions.setupDone)
          },
        ],
      },
      {
        name: 'Settings',
        url: null,
        expandable: true,
        submenu: [
          {
            name: 'Configuration',
            url: '/configuration',
            disabled: !(this.permissions.access.config.load)
          },
          {
            name: 'Cryptography',
            url: '/server-key-setting',
            disabled: !(this.permissions.access.crypto.import_public_key)
          },
          {
            name: 'Health Check',
            url: '/endpoints-health-check',
            disabled: !(this.permissions.access.log.read && this.permissions.setupDone)
          },
          {
            name: 'Log',
            url: '/log',
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
            name: 'Help Center',
            url: '/help-center'
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
        item.isActive = item.submenu.findIndex((el: any) => el.url === currentUrl) > -1;
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
    if (clickType !== 'Generate token') {
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
