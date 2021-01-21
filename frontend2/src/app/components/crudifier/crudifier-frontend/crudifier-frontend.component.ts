
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { Template } from '../../endpoints/models/template.model';
import { EndpointService } from '../../endpoints/services/endpoint.service';

/**
 * Crudifier component for generating a frontend from
 * meta information about backend.
 */
@Component({
  selector: 'app-crudifier-frontend',
  templateUrl: './crudifier-frontend.component.html',
  styleUrls: ['./crudifier-frontend.component.scss']
})
export class CrudifierFrontendComponent implements OnInit {

  /**
   * Available templates user can select.
   */
  public templates: string[] = [];

  /**
   * Currently selected temnplate.
   */
  public template: string = null;

  /**
   * Documentation for currently selected template.
   */
  public documentation: string = null;

  /**
   * Creates an instance of your component.
   * 
   * @param endpointService Needed to retrieve templates, meta information, and actually generate frontend
   */
  constructor(private endpointService: EndpointService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Invoking backend to retrieve templates.
    this.endpointService.templates().subscribe((result: string[]) => {

      // Assigning result of invocation to model.
      this.templates = result;
    });
  }

  /**
   * Invoked when user selects a template.
   */
  public templateChanged() {

    // Invoking backend to retrieve README.md file for template.
    this.endpointService.template(this.template).subscribe((result: Template) => {

      // Assigning result of invocation to model.
      this.documentation = result.markdown;
    });
  }
}
