
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { Status } from 'src/app/models/status.model';
import { ConfigService } from 'src/app/services/management/config.service';

/**
 * Configuration component allowing you to edit your system's configuration.
 */
@Component({
  selector: 'app-config',
  templateUrl: './config.component.html'
})
export class ConfigComponent implements OnInit {

  /**
   * Status of setup process.
   */
  status: Status = null;

  /**
   * Creates an instance of your component.
   * 
   * @param configService Configuration service used to load and save configuration settings
   */
  constructor(private configService: ConfigService) { }

  /**
   * OnInit implementation.
   */
  ngOnInit() {
    (async () => {
      while (!this.configService.setupStatus)
        await new Promise(resolve => setTimeout(resolve, 100));
      if (this.configService.setupStatus !== null) {
        this.status = this.configService.setupStatus;
      }
    })();
  }
}
