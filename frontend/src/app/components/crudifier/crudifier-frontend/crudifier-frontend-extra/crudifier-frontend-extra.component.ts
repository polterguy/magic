
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { Subscription } from 'rxjs';
import { Component, OnDestroy, OnInit } from '@angular/core';

// Application specific imports.
import { Message } from 'src/app/models/message.model';
import { BackendService } from 'src/app/services/backend.service';
import { MessageService } from 'src/app/services/message.service';
import { Endpoint } from '../../../endpoints/models/endpoint.model';
import { EndpointService } from '../../../endpoints/services/endpoint.service';

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
  selector: 'app-crudifier-frontend-extra',
  templateUrl: './crudifier-frontend-extra.component.html',
  styleUrls: ['./crudifier-frontend-extra.component.scss']
})
export class CrudifierFrontendExtraComponent implements OnInit, OnDestroy {

  // Used to subscribe to messages sent by other components.
  private subscription: Subscription;

  /**
   * Columns to display in endpoints table.
   */
  public displayedColumns: string[] = [
    'selected',
    'path',
    'verb',
  ];

  /**
   * Endpoints as retrieved from backend.
   */
  public endpoints: EndpointEx[];

  /**
   * True if advanced settings shoulkd be shown.
   */
  public advanced = false;

  /**
   * Docker image name as you want to publish it
   * to docker HUB for instance.
   */
  public dockerImage = 'servergardens/foo-bar';

  /**
   * Deployment URL where you want to deploy your frontend.
   */
  public deploymentUrl = 'foo-bar.servergardens.com';

  /**
   * List of modules we found in backend.
   */
  public modules: string[] = [];

  /**
   * Creates an instance of your component.
   * 
   * @param backendService Needed to retrieve root URL for current backend
   * @param endpointService Needed to retrieve templates, meta information, and actually generate frontend
   */
  constructor(
    private backendService: BackendService,
    private messageService: MessageService,
    private endpointService: EndpointService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Making sure we usbscribe to the 'generate' message.
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {
      if (msg.name === 'app.generator.generate-frontend') {
        this.generate(msg.content.template, msg.content.name, msg.content.copyright);
      }
    });

    // Retrieving endpoints from backend.
    this.endpointService.endpoints().subscribe((endpoints: Endpoint[]) => {

      // Assigning result to model.
      this.endpoints = endpoints
        .filter(x => !x.path.startsWith('magic/modules/system/') && !x.path.startsWith('magic/modules/magic/'))
        .filter(x => x.type === 'crud-count' ||
          x.type === 'crud-delete' ||
          x.type === 'crud-read' ||
           x.type === 'crud-create' ||
            x.type === 'crud-update')
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

        // Assigning modules to model.
        const modules: string[] = [];
        for (const idx of this.endpoints) {
          let moduleName = idx.path.substr('magic/modules/'.length);
          moduleName = moduleName.substr(0, moduleName.indexOf('/'));
          if (modules.indexOf(moduleName) === -1) {
            modules.push(moduleName);
          }
        }
        this.modules = modules;
    });
  }

  /**
   * Implementation of OnDestroy.
   */
  public ngOnDestroy() {

    // Making sure we unsubscribe to messages transmitted by other components.
    this.subscription.unsubscribe();
  }

  /**
   * Returns tooltip for generate button.
   */
  public getGenerateTooltip() {
    if (!this.endpoints) {
      return '';
    }
    let componentCount = this.endpoints.filter(x => x.selected && x.path.endsWith('-count')).length;
    let endpointCount = this.endpoints.filter(x => x.selected).length;
    return `Generate ${componentCount} components wrapping ${endpointCount} HTTP endpoints`;
  }

  /**
   * Returns the names of all component that will be generated.
   */
  public getComponents() {
    return this.endpoints
      .filter(x => x.path.endsWith('-count'))
      .map(x => {
        const componentName = x.path.substr(x.path.lastIndexOf('/') + 1);
        return componentName.substr(0, componentName.length - 6);
      });
  }

  /**
   * Returns the number of selected endpoints.
   */
  public selectedEndpoints() {
    return this.endpoints.filter(x => x.selected).length;
  }

  /**
   * Invoked when the user clicks a module.
   * 
   * @param module Name of module
   */
  public moduleClicked(module: string) {

    // Toggling the selected value of all endpoints encapsulated by module.
    const moduleEndpoints = this.endpoints.filter(x => x.path.startsWith('magic/modules/' + module + '/'));
    if (moduleEndpoints.filter(x => x.selected).length === moduleEndpoints.length) {
      for (const idx of moduleEndpoints) {
        idx.selected = false;
      }
    } else {
      for (const idx of moduleEndpoints) {
        let toBeSelected = true;
        for (var idx2 of moduleEndpoints.filter(x => x.selected && x.verb === idx.verb)) {
          const split1 = idx2.path.split('/');
          const split2 = idx.path.split('/');
          if (split1[split1.length - 1] === split2[split2.length - 1]) {
            toBeSelected = false;
          }
        }
        idx.selected = toBeSelected;
      }
    }
  }

  /**
   * Invoked when a component is selected or de-selected for being generated.
   * 
   * @param component Name of component that was clicked
   */
  public componentClicked(component: string) {

    // Finding all relevant components.
    const components = this.endpoints
      .filter(x => x.path.endsWith('/' + component) || x.path.endsWith('/' + component + '-count'));

    // Figuring out if we should select or de-select component.
    const shouldSelect = components.filter(x => !x.selected).length > 0;

    // Looping through all components and changing their selected state according to above logic.
    for (const idx of components) {
      idx.selected = shouldSelect;
    }
  }

  /**
   * Invoked to check if the specified module to selected or not, as
   * in all endpoints have been selected for crudification.
   * 
   * @param module What module to check for
   */
  public moduleSelected(module: string) {
    const moduleEndpoints = this.endpoints.filter(x => x.path.startsWith('magic/modules/' + module + '/'));
    if (moduleEndpoints.filter(x => x.selected).length === moduleEndpoints.length) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Returns true if component is selected.
   * 
   * @param component Name of component to check for
   */
  public componentSelected(component: string) {
    return this.endpoints
      .filter(x => x.selected)
      .filter(x => x.verb === 'get' && (x.path.endsWith('/' + component) || x.path.endsWith('/' + component + '-count'))).length === 2;
  }

  /*
   * Private helper methods.
   */

  /*
   * Invoked when user wants to generate a frontend of some sort.
   */
  private generate(template: string, name: string, copyright: string) {

    // Invoking backend to actually generate the specified frontend.
    const svcModel = this.createServiceModel(this.endpoints.filter(x => x.selected));
    this.endpointService.generate(
      template,
      this.backendService.current.url + '/',
      name,
      copyright === '' ? 'Automatically generated by Magic' : copyright,
      svcModel,
      this.deploymentUrl,
      this.dockerImage);
  }

  /*
   * Creates the requires HTTP service model for generating frontend
   * from frontend data model.
   */
  private createServiceModel(endpoints: EndpointEx[]) {
    const result: any[] = [];
    for (const idx of endpoints) {
      const tmp = {
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
          tmp.output[idxOutput.name] = idxOutput.type || tmp.input[idxOutput.name + '.eq'];
        }
      }
      result.push(tmp);
    }
    return result;
  }
}
