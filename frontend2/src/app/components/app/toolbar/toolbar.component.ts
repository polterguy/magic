
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { Messages } from 'src/app/models/message.model';

// Application specific imports.
import { AuthService } from 'src/app/services/auth.service';
import { MessageService } from 'src/app/services/message-service';

/**
 * Toolbar component for displaying toolbar that allow the
 * user to toggle the navbar.
 */
@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {

  constructor(
    public authService: AuthService,
    private messageService: MessageService) { }

  ngOnInit() {
  }

  /**
   * Toggles the navbar.
   */
  public toggleNavbar() {
    this.messageService.sendMessage({
      name: Messages.TOGGLE_NAVBAR
    });
  }

  /**
   * Returns the user's status to caller.
   */
  public getUserStatus() {
    if (this.authService.authenticated) {
      let url = this.authService.current.url.replace('http://', '').replace('https://', '');
      if (url.indexOf(':')) {
        url = url.substr(0, url.indexOf(':'));
      }
      return this.authService.current.username + '@' + url;
    } else if (this.authService.connected) {
      let url = this.authService.current.url.replace('http://', '').replace('https://', '');
      if (url.indexOf(':')) {
        url = url.substr(0, url.indexOf(':'));
      }
      return 'anonymous@' + url;
    } else {
      return 'Not connected'
    }
  }

  /**
   * Returns all roles user belongs to.
   */
  public getUserRoles() {
    return this.authService.roles().join(', ');
  }
}
