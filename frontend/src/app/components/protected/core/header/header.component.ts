
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, OnInit } from '@angular/core';
import { BackendService } from 'src/app/services/backend.service';
import { NavLinks } from 'src/app/models/nav-links';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from 'src/app/components/protected/common/dialog/dialog.component';
import { BackendsListComponent } from 'src/app/components/protected/core/header/components/backends-list/backends-list.component';
import { GenerateTokenDialogComponent } from 'src/app/components/protected/user/generate-token-dialog/generate-token-dialog.component';
import { Router } from '@angular/router';
import { MagicResponse } from 'src/app/models/magic-response.model';

/**
 * Header component showing navbar links and backend switcher.
 */
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  navLinks: NavLinks[] = [];
  activeUrl: string = '';
  backendList: any = [];
  sideExpanded: boolean = false;
  isAffiliate: boolean = false;
  completion: string = null;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private backendService: BackendService) { }

  ngOnInit() {

    this.createMenu();
    this.getSetupStatus();
    this.activeUrl = this.backendService.active.url.replace('http://', '').replace('https://', '');

    // Including AI chatbot
    const script = document.createElement('script');
    script.src = 'https://ainiro.io/magic/system/openai/include-chatbot.js?rtl=false&clear_button=false&follow_up=true&copyButton=false&new_tab=true&code=true&references=false&position=right&type=magic-documentation&header=Ask%20about%20Hyperlambda%20or%20Magic&popup=&button=AI%20Chatbot&placeholder=Ask%20me%20about%20Hyperlambda%20...&color=%23505050&start=%23fefefe&end=%23e0e0e0&link=%23fe8464&theme=modern-square&hidden=true&v=zxcweq';
    script.async = true;
    document.body.appendChild(script);
  }

  toggleSidebar() {

    this.sideExpanded = !this.sideExpanded;
  }

  closeSidebarInSidePanel(currentUrl: string) {

    this.checkActiveLink(currentUrl)
    if (!this.sideExpanded) {
      return;
    }
    this.toggleSidebar();
  }

  getGithubToken(clickType: string) {

    if (clickType !== 'Generate Token') {
      return;
    }

    this.dialog.open(GenerateTokenDialogComponent, {
      width: '500px',
      autoFocus: false,
      data: {
        username: 'service',
        roles: ['admin'],
        expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      }
    });
  }

  logout(clickType: string) {

    if (clickType !== 'Logout') {
      return;
    }
    this.backendService.logout(false);
    this.router.navigate(['/authentication']);
  }

  viewBackends() {

    this.dialog.open(DialogComponent, {
      width: '80vw',
      maxWidth: '90vw',
      minHeight: '100px',
      autoFocus: false,
      data: {
        component: BackendsListComponent
      }
    });
  }

  /*
   * Private helper methods.
   */

  private checkActiveLink(currentUrl: string) {

    this.navLinks.forEach((item: any) => {
      if (item.submenu) {
        item.isActive = item.submenu.findIndex((el: any) => (currentUrl || '').startsWith(el.url)) > -1;
      }
    });
  }

  private getSetupStatus() {

    // Subscribing to status changes and redirect accordingly if we need user to setup system.
    this.backendService.statusRetrieved.subscribe((status: MagicResponse) => {
      if (status) {
        if (!status.result) {
          this.router.navigate(['/setup']);
        }
      }
    });
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
            name: 'SQL Studio',
            url: '/sql-studio',
            exact: false,
          },
          {
            name: 'Generator',
            url: '/generator',
            exact: false,
          },
          {
            name: 'Hyper IDE',
            url: '/hyper-ide',
            exact: false,
          },
          {
            name: 'Chatbot Wizard',
            url: '/chatbot-wizard',
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
            name: 'Databases',
            url: '/databases',
            exact: false,
          },
          {
            name: 'Endpoints',
            url: '/endpoints',
            exact: false,
          },
          {
            name: 'Task Manager',
            url: '/task-manager',
            exact: false,
          },
          {
            name: 'Hyperlambda Playground',
            url: '/hyperlambda-playground',
            exact: false,
          },
          {
            name: 'Plugins',
            url: '/plugins',
            exact: false,
          },
          {
            name: 'Machine Learning',
            url: '/machine-learning',
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
            name: 'Log',
            url: '/log',
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

  showChatbot() {

    // Invoked when user wants to see the AI chatbot.
    let tmp: any = window;
    tmp.ainiro.show();
  }
}
