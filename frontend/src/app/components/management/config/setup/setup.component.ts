
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';

// Application specific imports.
import { BackendService } from 'src/app/services--/backend.service--';

/**
 * Component responsible for allowing user to setup system.
 */
@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent {

  @ViewChild('stepper') stepper: MatStepper;

  /**
   * Creates an instance of your type.
   *
   * @param backendService Needed to retrieve backend setup status
   */
  constructor(public backendService: BackendService) { }

  /**
   * Returns the selected index of the material stepper according
   * to how far into the setup process we've come.
   */
  getStepperSelectedIndex() {
    if (!this.backendService.active.status.config_done) {
      return 0;
    } else if (!this.backendService.active.status.magic_crudified) {
      return 1;
    } else if (!this.backendService.active.status.server_keypair) {
      return 2;
    }
    return 3;
  }
}
