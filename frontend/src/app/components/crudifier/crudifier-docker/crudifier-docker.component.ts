
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { Component } from '@angular/core';

// Application specific imports.
import { CrudifyService } from '../services/crudify.service';
import { FeedbackService } from 'src/app/services/feedback.service';

/**
 * Docker component to generate a docker-compose.yml template file, allowing you to deploy
 * Magic to your cloud vendor of choice.
 */
@Component({
  selector: 'app-crudifier-docker',
  templateUrl: './crudifier-docker.component.html',
  styleUrls: ['./crudifier-docker.component.scss']
})
export class CrudifierDockerComponent {

  /**
   * Frontend domain for your Magic deployment.
   */
  public domain = '';

  /**
   * API/backend domain for your Magic deployment.
   * 
   * Typically api.xxx.com if you're using xx.com as your frontend domain.
   */
  public apiDomain = '';

  /**
   * Creates an instance of yoru component.
   * 
   * @param crudifierService Needed to actually generate your docker-compose file.
   */
  constructor(
    private feedbackService: FeedbackService,
    private crudifierService: CrudifyService) { }

  /**
   * Invoked when user wants to generate his docker-compose file.
   */
  public generate() {

    // Sanity checking domain and api-domain before invoking backend.
    for (let idxDomain of [this.domain, this.apiDomain]) {
      for (let idx = 0; idx < idxDomain.length; idx++) {
        if ("abcdefghijklmnopqrstuvwxyz-_.1234567890".indexOf(idxDomain[idx]) === -1) {
          this.feedbackService.showError("Only alphanumeric characters in lowercase and '.', '-' or '_' are allowed");
          return;
        }
      }
    }
    if (this.domain.indexOf('.') === -1 || this.apiDomain.indexOf('.') === -1) {
      this.feedbackService.showError("A domain needs to have at least one '.' in it to be considered valid");
      return;
    }
    
    // Invoking backend to generate docker-compose.yml file, downloaded to client.
    this.crudifierService.generateDockerComposeFile(this.domain, this.apiDomain);
  }
}
