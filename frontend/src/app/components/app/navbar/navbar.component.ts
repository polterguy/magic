
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component } from '@angular/core';

// Application specific imports.
import { Messages } from 'src/app/models/messages.model';
import { MessageService } from 'src/app/services/message.service';
import { AuthService } from 'src/app/components/auth/services/auth.service';

/**
 * Component wrapping navbar.
 */
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {

  /**
   * Creates an instance of your component.
   * 
   * @param authService Authentication and authorisation HTTP service
   * @param messageService Message service to send messages to other components using pub/sub
   */
  constructor(
    public authService: AuthService,
    private messageService: MessageService) { }

  /**
   * Closes the navbar.
   */
  public closeNavbar() {
    this.messageService.sendMessage({
      name: Messages.CLOSE_NAVBAR
    });
  }
}
