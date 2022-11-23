
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GeneralService } from 'src/app/_general/services/general.service';
import { UserService } from 'src/app/_general/services/user.service';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { NavLinks } from './_model/nav-links';
import { Clipboard } from '@angular/cdk/clipboard';
import { Backend } from 'src/app/_protected/models/common/backend.model';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from 'src/app/_general/components/dialog/dialog.component';
import { BackendsListComponent } from 'src/app/_general/components/backends-list/backends-list.component';
import { Location } from '@angular/common';
import { CryptoService } from 'src/app/_protected/pages/setting-security/server-key-setting/_services/crypto.service';
import { GithubTokenDialogComponent } from 'src/app/_general/components/github-token-dialog/github-token-dialog.component';

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
    private location: Location,
    private clipboard: Clipboard,
    private generalService: GeneralService,
    private userService: UserService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private backendService: BackendService) {
      this.activatedRoute.queryParamMap.subscribe((params: any) => {
        if (params) {
          this.getParams(params)
        } else {
          this.getPermissions();
        }
      })
    }

    ngOnInit() {
    }

    public getPermissions() {
      (async () => {
        while (!this.backendService?.active?.access || !Object.keys(this.backendService?.active?.access?.auth ?? {}).length)
        await new Promise(resolve => setTimeout(resolve, 100));

        if (this.backendService?.active?.access && Object.keys(this.backendService?.active?.access?.auth)?.length > 0) {
          this.permissions = this.backendService.active;
          this.username = this.permissions.token ? this.permissions.token['_username'] : 'anonymous';
          this.backendService.active ? this.activeUrl = this.backendService.active.url.replace('http://', '').replace('https://', '') : this.activeUrl = 'not connected';
          this.backendList = this.backendService.backends;

          this.createMenu();
        // console.log(this.router.url,(this.navLinks.find((item: any) => item.name === 'Tools')?.submenu.findIndex((el: any) => el.url === this.router.url) > -1))
      }
    })();
  }

  /*
   * Retrieving URL parameter
   */
  private getParams(params: any) {

    // Parsing query parameters.
    // this.activated.queryParams.subscribe((params: Params) => {

      // Checking if user accessed system with a link containing query param pointing to specific backend.
      const backend = params['backend'];
      if (backend) {
        const cur = new Backend(backend);

        // Making sure we keep existing username, password and token, if we have these values.
        const old = this.backendService.backends.filter(x => x.url === cur.url);
        if (old.length > 0) {
          cur.username = old[0].username;
          cur.password = old[0].password;
          cur.token = old[0].token;
        }
        this.backendService.upsert(cur);
        this.backendService.activate(cur);
        this.location.replaceState('');

      } else {

        // Checking if user has some sort of token, implying reset-password token or verify-email token.
        const token = params['token'];
        if (token && token.includes('.')) {

          /*
           * 'token' query parameter seems to be a JWT token.
           *
           * Authentication request, authenticating using specified link,
           * and redirecting user to hide URL.
           */
          const url = params['url'];
          const username = params['username'];
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
                this.location.replaceState('');
              }
            },
            error: (error: any) => {}
          });

        } else if (token) {

          /*
           * 'token' seems to be a "verify email address" type of token since it doesn't contain "." characters.
           *
           * Need to set the current backend first.
           */
          const backend = new Backend(params['url'], params['username']);
          this.backendService.upsert(backend);
          this.backendService.activate(backend);

          // Verifying user's email address.
          // this.registerService.verifyEmail(params['username'], token).subscribe({
          //   next: (result: Response) => {
          //     if (result.result === 'success') {
          //       this.feedbackService.showInfo('You successfully confirmed your email address');
          //       this.location.replaceState('');
          //     }
          //   },
          //   error: (error: any) => this.feedbackService.showError(error)
          // });
        }
      }
      this.getPermissions();
    // });
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
            name: 'Generated databases',
            url: '/generated-database',
            disabled: !(this.permissions.access.endpoints.view && this.permissions.setupDone)
          },
          {
            name: 'Generated endpoints',
            url: '/generated-endpoints',
            disabled: !(this.permissions.access.endpoints.view && this.permissions.setupDone)
          },
          {
            name: 'Generated sockets',
            url: '/generated-sockets',
            disabled: !(this.permissions.access.sockets.read && this.permissions.setupDone)
          },
          {
            name: 'Generated frontend',
            url: '/generated-frontend',
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
            name: 'Database',
            url: '/database-management',
            disabled: !(this.permissions.access.sql.execute_access && this.permissions.setupDone)
          },
          {
            name: 'Endpoint generator',
            url: '/endpoint-generator',
            disabled: !(this.permissions.access.crud.generate_crud && this.permissions.access.crud.generate_sql && this.permissions.access.crud.generate_frontend && this.permissions.setupDone)
          },
          {
            name: 'Frontend generator',
            url: '/frontend-generator',
            disabled: !(this.permissions.access.crud.generate_crud && this.permissions.access.crud.generate_sql && this.permissions.access.crud.generate_frontend && this.permissions.setupDone)
          },
          {
            name: 'Plugins',
            url: '/plugins',
            disabled: !(this.permissions.access.bazar.get_manifests && this.permissions.setupDone)
          },
          {
            name: 'Hyperlambda playground',
            url: '/hyperlambda-playground',
            disabled: !(this.permissions.access.eval.execute && this.permissions.setupDone)
          },
          {
            name: 'Tasks',
            url: '/tasks',
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
            name: 'Configuration',
            url: '/configuration',
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
            name: 'Endpoints health check',
            url: '/endpoints-health-check',
            disabled: !(this.permissions.access.log.read && this.permissions.setupDone)
          }
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
            name: 'GitHub token',
          },
          {
            name: 'Logout',
            color: 'warn'
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
    if (clickType !== 'GitHub token') {
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
