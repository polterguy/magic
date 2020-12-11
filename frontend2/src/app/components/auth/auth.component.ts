
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { BaseComponent } from '../base.component';
import { MessageService } from 'src/app/services/message.service';

/**
 * Authentication and authorization component, allowing you to administrate and manage
 * your roles and users in your Magic backend.
 */
@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent extends BaseComponent implements OnInit {

  /**
   * Creates an instance of your component.
   * 
   * @param messageService Message service to subscribe and publish messages to and from other components
   */
  constructor(protected messageService: MessageService) {
    super(messageService);
  }

  ngOnInit() {
  }
}
