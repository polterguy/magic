
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component } from '@angular/core';

// Application specific imports.
import { BackendService } from 'src/app/services--/backend.service--';

/**
 * Configuration component allowing you to edit your system's configuration.
 */
@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent {

  /**
   * Creates an instance of your component.
   *
   * @param backendService Needed to retrieve setup status of backend.
   */
  constructor(public backendService: BackendService) { }
}
