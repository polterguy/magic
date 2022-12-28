
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { BackendService } from 'src/app/_general/services/backend.service';
import { NavLinks } from './_model/nav-links';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from 'src/app/_general/components/dialog/dialog.component';
import { BackendsListComponent } from 'src/app/_general/components/backends-list/backends-list.component';
import { GithubTokenDialogComponent } from 'src/app/_protected/pages/user/generate-token-dialog/generate-token-dialog.component';
import { Status } from 'src/app/_protected/models/common/status.model';
import { Router } from '@angular/router';

/**
 * Header component showing navbar links and backend switcher.
 */
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  public navLinks: NavLinks[] = [];

  public activeUrl: string = '';

  public backendList: any = [];

  public sideExpanded: boolean = false;

  public isAffiliate: boolean = false;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private backendService: BackendService) { }

  ngOnInit() {
    this.createMenu();
    this.getSetupStatus();
    this.activeUrl = this.backendService.active.url.replace('http://', '').replace('https://', '');
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
            exact: false,
          },
          {
            name: 'SQL Studio',
            url: '/sql-studio',
            exact: false,
          },
          {
            name: 'Endpoint Generator',
            url: '/endpoint-generator',
            exact: false,
          },
          {
            name: 'Frontend Generator',
            url: '/frontend-generator',
            exact: false,
          },
          {
            name: 'Hyper IDE',
            url: '/hyper-ide',
            exact: false,
          },
          {
            name: 'Frontend IDE',
            url: '/frontend-ide',
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
            exact: false,
          },
          {
            name: 'Endpoints',
            url: '/endpoints',
            exact: false,
          },
          {
            name: 'Tasks',
            url: '/tasks',
            exact: false,
          },
          {
            name: 'Hyperlambda Playground',
            url: '/hyperlambda-playground',
            exact: false,
          },
          {
            name: 'Sockets',
            url: '/sockets',
            exact: false,
          },
          {
            name: 'Plugins',
            url: '/plugins',
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
            exact: false,
          },
          {
            name: 'Health Check',
            url: '/health-check',
            exact: false,
          },
          {
            name: 'Cryptography',
            url: '/cryptography',
            exact: false,
          },
          {
            name: 'Log',
            url: '/log',
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
        name: this.backendService.active.username,
        url: null,
        expandable: true,
        exact: false,
        submenu: [
          {
            name: 'Profile',
            url: '/user-profile',
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

  public checkActiveLink(currentUrl: string) {
    this.navLinks.forEach((item: any) => {
      if (item.submenu) {
        item.isActive = item.submenu.findIndex((el: any) => (currentUrl || '').startsWith(el.url)) > -1;
      }
    })
  }

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

  public getGithubToken(clickType: string) {
    if (clickType !== 'Generate Token') {
      return;
    }

    this.dialog.open(GithubTokenDialogComponent, {
      width: '500px',
      autoFocus: false,
      data: {
        username: this.backendService.active.username,
        role: 'root',
        expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
      }
    })
  }

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
        if (!status.result) {
          this.router.navigate(['/setup']);
        }
      }
    });
  }
}
