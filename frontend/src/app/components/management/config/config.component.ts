
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { BackendService } from 'src/app/services/backend.service';
import { ConfigService } from 'src/app/services/management/config.service';

/**
 * Configuration component allowing you to edit your system's configuration.
 */
@Component({
  selector: 'app-config',
  templateUrl: './config.component.html'
})
export class ConfigComponent {

  /**
   * Creates an instance of your component.
   * 
   * @param backendService Needed to retrieve setup status of backend.
   */
  constructor(public backendService: BackendService) { }
}
