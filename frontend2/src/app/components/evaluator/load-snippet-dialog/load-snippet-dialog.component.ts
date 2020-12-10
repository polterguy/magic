
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { BaseComponent } from '../../base.component';
import { MessageService } from 'src/app/services/message.service';

/**
 * Login dialog allowing user to login to a backend of his choice.
 */
@Component({
  selector: 'app-load-snippet-dialog',
  templateUrl: './load-snippet-dialog.component.html',
  styleUrls: ['./load-snippet-dialog.component.scss']
})
export class LoadSnippetDialogComponent extends BaseComponent implements OnInit {

  /**
   * Creates an instance of your login dialog.
   * 
   * @param messageService Dependency injected message service to publish information from component to subscribers
   */
  constructor(protected messageService: MessageService) {
    super(messageService);
  }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {
  }
}
