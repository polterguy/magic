
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

// Application specific imports.
import { UserService } from 'src/app/services/user.service';
import { BaseComponent } from 'src/app/components/base.component';
import { MessageService } from 'src/app/services/message.service';

/**
 * Modal dialog component for creating a new user.
 */
@Component({
  selector: 'app-new-user',
  templateUrl: './new-user-dialog.component.html',
  styleUrls: ['./new-user-dialog.component.scss']
})
export class NewUserDialogComponent extends BaseComponent {

  /**
   * Username for new user.
   */
  public username: string = '';

  /**
   * Initial password for new user.
   */
  public password: string = '';

  /**
   * Creates an instance of your component.
   * 
   * @param userService Used to create a new user
   * @param dialogRef Dialog reference used to close dialog
   * @param messageService Message service used to publish messages to other components
   */
  constructor(
    private userService: UserService,
    private dialogRef: MatDialogRef<NewUserDialogComponent>,
    protected messageService: MessageService) {
      super(messageService);
    }

  /**
   * Creates a new user.
   */
  public create() {

    // Invoking backend to create the new user.
    this.userService.create(this.username, this.password).subscribe((res: any) => {

      // Success! User created.
      this.dialogRef.close(this.username);
    }, (error: any) => this.showError(error));
  }
}
