
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { Component, OnInit } from '@angular/core';
import { BackendService } from 'src/app/services/backend.service';

// Application specific imports.
import { Endpoint } from '../../endpoints/models/endpoint.model';
import { Template } from '../../endpoints/models/template.model';
import { EndpointService } from '../../endpoints/services/endpoint.service';

/**
 * Endpoint model class, for allowing user to select which endpoints
 * he or she wants to include in the generated frontend.
 */
class EndpointEx extends Endpoint {

  /**
   * Whether or not endpoint has been selected.
   */
  selected: boolean;
}

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
   * Columns to display in endpoints table.
   */
  public displayedColumns: string[] = [
    'selected',
    'path',
    'verb',
  ];

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
   * Endpoints as retrieved from backend.
   */
  public endpoints: EndpointEx[];

  /**
   * Creates an instance of your component.
   * 
   * @param backendService Needed to retrieve root URL for current backend
   * @param endpointService Needed to retrieve templates, meta information, and actually generate frontend
   */
  constructor(
    private backendService: BackendService,
    private endpointService: EndpointService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Invoking backend to retrieve templates.
    this.endpointService.templates().subscribe((result: string[]) => {

      // Assigning result of invocation to model.
      this.templates = result;
    });

    // Retrieving endpoints from backend.
    this.endpointService.endpoints().subscribe((endpoints: Endpoint[]) => {
      this.endpoints = endpoints
        .filter(x => !x.path.startsWith('magic/modules/system/'))
        .map(x => {
          return {
            path: x.path,
            verb: x.verb,
            consumes: x.consumes,
            produces: x.produces,
            input: x.input,
            output: x.output,
            array: x.array,
            auth: x.auth,
            type: x.type,
            description: x.description,
            selected: true
          };
        });
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

  /**
   * Invoked when user wants to generate a frontend of some sort.
   */
  public generate() {

    // Invoking backend to actually generate the specified frontend.
    this.endpointService.generate(
      this.template,
      this.backendService.current.url,
      'Foo',
      'Copyright foo bar AS',
      this.createServiceModel(this.endpoints));
  }

  /*
   * Private helper methods.
   */

  /*
   * Creates the requires HTTP service model for generating frontend
   * from frontend data model.
   */
  private createServiceModel(endpoints: EndpointEx[]) {
    const result: any[] = [];
    for (const idx of endpoints) {
      const tmp = {
        array: idx.array,
        auth: idx.auth,
        description: idx.description,
        path: idx.path,
        type: idx.type,
        verb: idx.verb,
        input: {},
        output: {},
      };
      if (idx.input && idx.input.length > 0) {
        for (const idxInput of idx.input) {
          tmp.input[idxInput.name] = idxInput.type;
        }
      }
      if (idx.output && idx.output.length > 0) {
        for (const idxOutput of idx.output) {
          tmp.output[idxOutput.name] = idxOutput.type;
        }
      }
      result.push(tmp);
    }
    return result;
  }
}
