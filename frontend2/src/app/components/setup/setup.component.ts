
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { Status } from 'src/app/models/status.model';

// Application specific imports.
import { SetupService } from 'src/app/services/setup.service';

/**
 * Setup component allowing you to setup and modify your system's configuration.
 */
@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit {

  public status: Status;

  /**
   * Creates an instance of your component.
   * 
   * @param setupService Setup HTTP service to use for retrieving and saving configuration settings for your backend
   */
  constructor(private setupService: SetupService) { }

  /**
   * OnInit implementation.
   */
  ngOnInit() {

    // Checking status of backend.
    this.setupService.status().subscribe(res => {
      this.status = res;
    });
  }
}
