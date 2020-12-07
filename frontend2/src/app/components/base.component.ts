
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

import { Messages } from '../models/message.model';
import jsonOptions from '../settings/code.json.json';
import { MessageService } from '../services/message.service';

 /**
  * Base component that most other components inherits from.
  * 
  * This class provides common functionality for other components,
  * such as the ability to display information and errors to the user,
  * etc.
  */
export abstract class BaseComponent {

  /**
   * Options for CodeMirror editors.
   */
  public codemirror = {
    json: jsonOptions,
  };

  /**
   * Creates an instance of your class
   * 
   * @param messageService Message service used to publish messages for other components.
   */
  constructor(protected messageService: MessageService) { }

  /**
   * Shows a message with some information to the user.
   * 
   * @param content Message to show
   */
  protected showInfo(content: string) {
    this.messageService.sendMessage({
      name: Messages.SHOW_INFO,
      content
    });
  }

  /**
   * Shows a short message with some information to the user.
   * 
   * @param content Message to show
   */
  protected showInfoShort(content: string) {
    this.messageService.sendMessage({
      name: Messages.SHOW_INFO_SHORT,
      content
    });
  }

  /**
   * Shows an error message with some information to the user.
   * 
   * @param content Message to show, or object containing error message as returned from backend
   */
  protected showError(content: any) {
    this.messageService.sendMessage({
      name: Messages.SHOW_ERROR,
      content
    });
  }
}
