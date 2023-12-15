
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { BackendService } from 'src/app/_general/services/backend.service';
import { NavLinks } from './_model/nav-links';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from 'src/app/_general/components/dialog/dialog.component';
import { BackendsListComponent } from 'src/app/_general/components/backends-list/backends-list.component';
import { GenerateTokenDialogComponent } from 'src/app/_protected/pages/user/generate-token-dialog/generate-token-dialog.component';
import { Status } from 'src/app/_protected/models/common/status.model';
import { Router } from '@angular/router';
import { MessageService } from 'src/app/_general/services/message.service';
import { Message } from 'src/app/models/message.model';
import { MatMenuTrigger } from '@angular/material/menu';

/**
 * Header component showing navbar links and backend switcher.
 */
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  @ViewChild('completion_menu_trigger') completion_menu_trigger: MatMenuTrigger;

  help_description: string;
  help_url: string;
  navLinks: NavLinks[] = [];
  activeUrl: string = '';
  backendList: any = [];
  sideExpanded: boolean = false;
  isAffiliate: boolean = false;
  completion: string = null;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private messageService: MessageService,
    private backendService: BackendService) { }

  ngOnInit() {

    this.createMenu();
    this.getSetupStatus();
    this.activeUrl = this.backendService.active.url.replace('http://', '').replace('https://', '');
    this.help_description = this.getComponentDescription();
    this.help_url = this.getComponentURL();

    this.router.events.subscribe({
      next: (result: any) => {

        if (result.type === 1) {
          this.help_description = this.getComponentDescription();
          this.help_url = this.getComponentURL();
        }
      }
    });

    this.messageService.subscriber().subscribe((msg: Message) => {

      switch (msg.name) {

        case 'magic.show-help':
          this.completion = msg.content;
          this.completion_menu_trigger.openMenu();
          break;
      }
    });
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
        username: this.backendService.active.username,
        role: 'admin',
        expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
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

  private getComponentDescription() {

    const vals = this.router.url.split('/');
    const val = vals[1] === '' ? '/' : vals[1];

    switch (val) {

      case '/':
        return `The Magic Dashboard is the primary tool for managing an AINIRO.IO Magic Cloud installation.
It provides a graphical user interface for managing tasks, machine learning models, Hyperlambda code,
and other aspects of your cloudlet. It also contains key performance indicators, charts, and a YouTube
tutorial for getting started with Magic and Hyperlambda.`;

      case 'chatbot-wizard':
        return `The Chatbot Wizard allows you to rapidly create a chatbot for your website by providing
your OpenAI API Key, your Google reCAPTCHA site-key and secret, and the URL for your website.
It doesn't give you as many options as the Machine Learning component, but rapidly allows you to create
a chatbot you can embed on your website. You can start out with this wizard, for then to later edit your
model using the Machine Learning component.`;

      case 'sql-studio':
        return `SQL Studio is where you can both visually design your databases in addition to execute
SQL towards your database of choice. It transparently supports any of the following databases; SQL Server, 
MySQL, PostgreSQL, MariaDB and SQLite.`;

      case 'databases':
        return `The databases component is where you manage your databases, and your connection strings.
It is also where you can create new databases. It transparently allows you to create a new database in
SQLite, MySQL, MariaDB, PostgreSQL and SQL Server.`;

      case 'endpoint-generator':
        return `The endpoint generator is where you can automatically create CRUD endpoints wrapping
your database of choice, in addition to creating SQL based endpoints. It give you a whole range of
settings, such as turning on or off logging, publishing socket messages upon invocation to write endpoints,
authentication and authorisation configuration options, etc.`;

      case 'hyper-ide':
        return `Hyper IDE is Magic's integrated IDE, and is particularly good for editing Hyperlambda files.
It also gives you macros, machine learning and AI capabilities, in addition to a whole range of other
features that simplifies your life as a software developer. You would typically want to use Hyper IDE
on your generated Hyperlambda code after having used the endpoint generator to apply your own
custom business logic according to your requirements.`;

      case 'user-roles-management':
        return `The users and roles component it where you can manage your users and roles.
From this component you can create new users and roles, in addition to associate users with roles.
You can also import users from CSV files. You can also edit users, and lock out specific users
from your cloudlet using this component.`;

      case 'endpoints':
        return `The Endpoints component in Magic allows you to view and test your HTTP endpoints.
It provides a search function, parameters, and the ability to simulate a client. It also includes
meta data for each endpoint, such as the URL, HTTP verb, type of data consumed and produced,
authorization requirements, and more. Once an endpoint is invoked, a health check test can be created
to sanity check the system. This component also supports providing JSON payloads to POST and PUT endpoints.`;

      case 'tasks':
        return `The tasks component allows you to create and persist tasks to your database.
You can either schedule tasks for later, either a specific date and time in the future or repeatedly,
or you can trigger tasks from other parts of your Hyperlambda code. Tasks are persisted to
your Magic database, so even if your server is restarted, scheduled tasks will for the most parts
be correctly re-scheduled.`;

      case 'hyperlambda-playground':
        return `The Hyperlambda Playground component allows you to play with Hyperlambda code,
execute your code in “immediate mode”, and see the result of your execution immediately.
It also contains a range of “Hyperlambda snippets” which demonstrate Hyperlambda's capabilities
and provide examples for you to learn Hyperlambda. The “Save” button allows you to store your Hyperlambda
snippets as “admin snippets” which can be quickly executed later.`;

      case 'sockets':
        return `The sockets component allows you to play with and debug your socket messages.
Subscribe to sockets you wish to debug, and/or publish socket messages as you see fit from this component,
and see the result in this component.`;

      case 'plugins':
        return `Magic's plugin component is an integrated "AppStore" that allows you to install backend
microservices on the fly without interrupting normal usage. It provides access to AINIRO.IO's repository of
pre-fabricated microservices, such as translations, ticket management, CRM, Stripe payments, and SQLite
databases. Most plugins automatically create their databases and any other necessary components for
initialization. You can view and edit the plugin code after installing a plugin using Hyper IDE and SQL Studio.`;

      case 'machine-learning':
        return `The machine learning component allows you to create and test AI models.
It also allows you to import training data for your AI models, either from files containing your
training data, or by crawling and scraping a website. When you have gathered training data, and
quality assured your training data, you can upload it to OpenAI's API automatically using this component,
resulting in a new machine learning model you can test from here, and consume in your own projects.`;

      case 'configuration':
        return `The configuration component is where can modify your server's configuration settings, and
is typically used to for instance configure your server's SMTP settings, etc. Be careful as you're editing
your server's configuration, since applying a wrong configuration setting might in theory make your
server inaccessible.`;

      case 'health-check':
        return `The health check component allows you to easily sanity check your system, providing you with
a diagnostic tool to ensure it is functioning correctly. Automated tests can be created with the "Endpoints"
menu item or manually written in Hyperlambda. You can then run all tests automatically and view any errors that arise.`;

      case 'log':
        return `The Log component in Magic allows you to browse your server's log and filter for specific items.
There are 4 types of log entries you can create: debug, info, error, and fatal. You can configure the log
level to adjust how much is logged. Refer to magic.lambda.logging to understand how you can create
log items from your own Hyperlambda code.`;

      case 'user-profile':
        return `The Profile component of Magic allows you to customize you profile by changing your password,
theme, and name. However, you cannot change your username or email address due to the need for double
optin verification and potential referential integrity issues.`;
    }
  }

  private getComponentURL() {

    const vals = this.router.url.split('/');
    const val = vals[1] === '' ? '/' : vals[1];

    switch (val) {

      case '/':
        return 'https://polterguy.github.io';

      case 'chatbot-wizard':
        return 'https://polterguy.github.io/documentation/magic/components/chatbot-wizard/';

      case 'sql-studio':
        return 'https://polterguy.github.io/documentation/magic/components/sql/';

      case 'databases':
        return 'https://polterguy.github.io/documentation/magic/components/databases/';

      case 'endpoint-generator':
        return 'https://polterguy.github.io/documentation/magic/components/crudifier/backend/';

      case 'frontend-generator':
        return 'https://polterguy.github.io/documentation/magic/components/crudifier/frontend/';

      case 'hyper-ide':
        return 'https://polterguy.github.io/documentation/magic/components/hyper-ide/';

      case 'user-roles-management':
        return 'https://polterguy.github.io/documentation/magic/components/auth/';

      case 'endpoints':
        return 'https://polterguy.github.io/documentation/magic/components/endpoints/';

      case 'tasks':
        return 'https://polterguy.github.io/documentation/magic/components/tasks/';

      case 'hyperlambda-playground':
        return 'https://polterguy.github.io/documentation/magic/components/evaluator/';

      case 'sockets':
        return 'https://polterguy.github.io/documentation/magic/components/sockets/';

      case 'plugins':
        return 'https://polterguy.github.io/documentation/magic/components/bazar/';

      case 'machine-learning':
        return 'https://polterguy.github.io/documentation/magic/components/machine-learning/';

      case 'configuration':
        return 'https://polterguy.github.io/documentation/magic/components/config/';

      case 'health-check':
        return 'https://polterguy.github.io/documentation/magic/components/assumptions/';

      case 'log':
        return 'https://polterguy.github.io/documentation/magic/components/log/';

      case 'help-center':
        return 'https://polterguy.github.io/documentation/magic/';

      case 'user-profile':
        return 'https://polterguy.github.io/documentation/magic/components/profile/';
    }
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
            name: 'Health Check',
            url: '/health-check',
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
}
