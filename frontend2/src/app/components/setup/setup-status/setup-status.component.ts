
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Input, OnInit } from '@angular/core';

// Application specific imports.
import { Status } from 'src/app/models/status.model';

/**
 * Component responsible for displaying status of setup process.
 */
@Component({
  selector: 'app-setup-status',
  templateUrl: './setup-status.component.html',
  styleUrls: ['./setup-status.component.scss']
})
export class SetupStatusComponent implements OnInit {

  @Input() public status: Status;

  /**
   * Creates an instance of your component.
   */
  constructor() { }

  /**
   * OnInit implementation.
   */
  ngOnInit() {
  }
}
