
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Input } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';

// Application specific imports.
import { Endpoint } from 'src/app/models/endpoint.model';
import { EndpointService } from '../services/endpoint.service';
import { BackendService } from 'src/app/services/backend.service';

/**
 * Endpoint details component, showing information specific to a single
 * endpoint, and allowing user to invoke endpoint.
 */
@Component({
  selector: 'app-endpoint-details',
  templateUrl: './endpoint-details.component.html',
  styleUrls: ['./endpoint-details.component.scss']
})
export class EndpointDetailsComponent {

  /**
   * Model for instance.
   */
  @Input() public endpoint: Endpoint;

  /**
   * Creates an instance of your component.
   * 
   * @param clipboard Needed to copy URL of endpoint
   * @param backendService Needed to retrieve base root URL for backend
   * @param endpointService Needed to be able to invoke endpoint
   */
  constructor(
    private clipboard: Clipboard,
    private backendService: BackendService,
    private endpointService: EndpointService) { }

  /**
   * Returns string representing authorization requirements for endpoint.
   * 
   * @param auth List of roles
   */
  public getAuth(auth: string[]) {
    return auth.join(', ');
  }

  /**
   * Invoked when user wants to copy the full URL of the endpoint.
   */
  public copyUrl() {

    // Copies the currently edited endpoint's URL prepended by backend root URL.
    this.clipboard.copy(this.backendService.current.url + '/' + this.endpoint.path);
  }
}
