
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { Status } from 'src/app/models/status.model';

// Application specific imports.
import { ConfigService } from 'src/app/services/config.service';

/**
 * Setup component allowing you to setup and modify your system's configuration.
 */
@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {

  /**
   * Status of setup process.
   */
  public status: Status = null;

  /**
   * Creates an instance of your component.
   * 
   * @param setupService Setup HTTP service to use for retrieving and saving configuration settings for your backend
   */
  constructor(private setupService: ConfigService) { }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    // Checking status of backend.
    this.setupService.status().subscribe(res => {
      this.status = res;
    });
  }
}
