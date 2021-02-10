
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { Component } from '@angular/core';

// Application specific imports.
import { CrudifyService } from '../services/crudify.service';

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
  constructor(private crudifierService: CrudifyService) { }

  /**
   * Invoked when user wants to generate his docker-compose file.
   */
  public generate() {
    
    // Invoking backend to generate docker-compose.yml file, downloaded to client.
    this.crudifierService.generateDockerComposeFile(this.domain, this.apiDomain);
  }
}
