
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Input } from '@angular/core';

// Application specific imports.
import { Status } from 'src/app/models/status.model';

/**
 * Component responsible for allowing user to setup system.
 */
@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent {

  @Input() public status: Status;

  /**
   * Creates an instance of your component.
   */
  constructor() { }

  /**
   * Returns the percentage of how much more work needs to be
   * done in order to finish the setup process of the system.
   */
  public getSetupProgress() {
    let percentage = 0;
    if (this.status.setup_done) {
      percentage += 33;
    }
    if (this.status.magic_crudified) {
      percentage += 33;
    }
    if (this.status.server_keypair) {
      percentage += 33;
    }
    return percentage;
  }
}
