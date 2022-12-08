
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Endpoint } from 'src/app/_protected/models/common/endpoint.model';

// Application specific imports.

/**
 * Component for executing an endpoint file through a modal window.
 */
@Component({
  selector: 'app-execute-endpoint-dialog',
  templateUrl: './execute-endpoint-dialog.component.html',
  styleUrls: ['./execute-endpoint-dialog.component.scss']
})
export class ExecuteEndpointDialogComponent {

  /**
   * Creates an instance of your component.
   *
   * @param data Filename wrapping endpoint
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: Endpoint) { }
}