
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

// Application specific imports.
import { RoleService } from 'src/app/services/role.service';
import { BaseComponent } from 'src/app/components/base.component';
import { MessageService } from 'src/app/services/message.service';

/**
 * Modal dialog used to allow user to create a new role in the system.
 */
@Component({
  selector: 'app-new-role-dialog',
  templateUrl: './new-role-dialog.component.html',
  styleUrls: ['./new-role-dialog.component.scss']
})
export class NewRoleDialogComponent extends BaseComponent {

  /**
   * Name of new role to create.
   */
  public name = '';

  /**
   * Description of new role.
   */
  public description = '';

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to be able to close dialog when user clicks create button
   * @param messageService Message service used to communicate between components
   */
  constructor(
    private dialogRef: MatDialogRef<NewRoleDialogComponent>,
    private roleService: RoleService, 
    protected messageService: MessageService) {
    super(messageService);
  }

  /**
   * Invoked when user clicks the create button to create his new role.
   */
  public create() {

    // Invoking backend to create a new role.
    this.roleService.create(this.name, this.description).subscribe((res: any) => {

      // Success! Closing dialog and informing the caller the name of the new role.
      this.dialogRef.close(this.name);
    }, (error: any) => this.showError(error));
  }
}
