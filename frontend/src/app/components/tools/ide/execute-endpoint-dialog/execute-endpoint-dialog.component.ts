
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { Endpoint } from '../../../../_protected/pages/administration/generated-endpoints/_models/endpoint.model';

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
