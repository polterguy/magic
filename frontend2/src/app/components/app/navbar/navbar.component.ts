
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { Messages } from 'src/app/models/message.model';
import { AuthService } from 'src/app/services/auth.service';
import { MessageService } from 'src/app/services/message-service';

/**
 * Component wrapping navbar for dashboard.
 */
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

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
      name: Messages.CLOSE_NAVBAR
    });
  }
}
