
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */
import { Subscription } from 'rxjs';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';

// Application specific imports.
import { Message } from 'src/app/models/message.model';
import { CrudifyService } from '../../services/crudify.service';
import { MessageService } from 'src/app/services/message.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { Endpoint } from '../../../../analytics/endpoints/models/endpoint.model';
import { EndpointService } from 'src/app/services/endpoint.service';

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
  selector: 'app-crud-frontend-extra',
  templateUrl: './crud-frontend-extra.component.html',
  styleUrls: ['./crud-frontend-extra.component.scss']
})
export class CrudFrontendExtraComponent implements OnInit, OnDestroy {

  // Used to subscribe to messages sent by other components.
  private subscription: Subscription;

  /**
   * Template user selected
   */
  @Input() template: string;

  /**
   * Columns to display in endpoints table.
   */
  displayedColumns: string[] = [
    'selected',
    'path',
    'verb',
  ];

  /**
   * Endpoints as retrieved from backend.
   */
  endpoints: EndpointEx[];

  /**
   * True if advanced settings shoulkd be shown.
   */
  advanced = false;

  /**
   * List of modules we found in backend.
   */
  modules: string[] = [];

  /**
   * Custom args associates with template.
   */
  custom: any = null;

  /**
   * Additional args as passed in during crudification.
   */
  args: any = {};

  /**
   * Creates an instance of your component.
   * 
   * @param messageService Needed to subscribe to messages published by other components
   * @param endpointService Needed to retrieve templates, meta information, and actually generate frontend
   * @param feedbackService Needed to provide feedback to user
   * @param crudifyService Needed to perform tha actual creation of our frontend
   */
  constructor(
    private messageService: MessageService,
    private endpointService: EndpointService,
    private feedbackService: FeedbackService,
    private crudifyService: CrudifyService) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.crudifyService.templateCustomArgs(this.template).subscribe({
      next: (res: any) => {
        this.custom = res;
        for (const idx in res) {
          if (Array.isArray(res[idx])) {
            this.args[idx] = res[idx][0].value;
          }
        }
      },
      error: (error: any) => this.feedbackService.showError(error)});
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {
      if (msg.name === 'app.generator.generate-frontend') {
        this.generate(
          msg.content.template,
          msg.content.name,
          msg.content.copyright,
          msg.content.apiUrl,
          msg.content.frontendUrl,
          msg.content.email,
          msg.content.deployLocally);
      }
    });

    this.endpointService.endpoints().subscribe({
      next: (endpoints: Endpoint[]) => {
        this.endpoints = endpoints
          .filter(x => !x.path.startsWith('magic/system/') && !x.path.startsWith('magic/modules/magic/'))
          .filter(x => x.type === 'crud-count' || x.type === 'crud-delete' || x.type === 'crud-read' || x.type === 'crud-create' || x.type === 'crud-update')
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
              selected: true,
            };
          });

        const modules: string[] = [];
        for (const idx of this.endpoints) {
          let moduleName = idx.path.substring('magic/modules/'.length);
          moduleName = moduleName.substring(0, moduleName.indexOf('/'));
          if (modules.indexOf(moduleName) === -1) {
            modules.push(moduleName);
          }
        }
        this.modules = modules;
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Implementation of OnDestroy.
   */
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /**
   * Returns tooltip for generate button.
   */
  getGenerateTooltip() {
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
  getComponents() {
    return this.endpoints
      .filter(x => x.type === 'crud-count')
      .map(x => {
        const componentName = x.path.substring(14);
        return componentName.substring(0, componentName.length - 6);
      });
  }

  /**
   * Returns the number of selected endpoints.
   */
  selectedEndpoints() {
    return this.endpoints.filter(x => x.selected).length;
  }

  /**
   * Invoked when the user clicks a module.
   * 
   * @param module Name of module
   */
  moduleClicked(module: string) {
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
  componentClicked(component: string) {
    const components = this.endpoints
      .filter(x => x.path.endsWith('/' + component) || x.path.endsWith('/' + component + '-count'));
    const shouldSelect = components.filter(x => !x.selected).length > 0;
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
  moduleSelected(module: string) {
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
  componentSelected(component: string) {
    return this.endpoints
      .filter(x => x.selected)
      .filter(x => {
        return x.verb === 'get' && x.type === 'crud-count' && (x.path == 'magic/modules/' + component + '-count');
      }).length === 1;
  }

  /**
   * Needed to make sure clicking checkbox actually works.
   * 
   * @param e Event
   */
  swallow(e: Event) {
    e.stopPropagation();
  }

  /*
   * Private helper methods.
   */

  /*
   * Invoked when user wants to generate a frontend of some sort.
   */
  private generate(
    template: string,
    name: string,
    copyright: string,
    apiUrl: string,
    frontendUrl: string,
    email: string,
    deployLocally: boolean) {

    while (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.substring(0, apiUrl.length - 1);
    }

    const svcModel = this.createServiceModel(this.endpoints.filter(x => x.selected));
    this.crudifyService.generate(
      template,
      apiUrl + '/',
      frontendUrl,
      email,
      name,
      copyright === '' ? 'Automatically generated by Magic' : copyright,
      svcModel,
      deployLocally,
      this.args, 
      () => {
        this.messageService.sendMessage({
          name: deployLocally ? 'magic.crudifier.frontend-generated-locally' : 'magic.crudifier.frontend-generated'
        });
      });
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
        input: [],
        output: [],
      };
      if (idx.input && idx.input.length > 0) {
        idx.input.sort((lhs, rhs) => {
          if (lhs.name.toLowerCase() === 'name' && rhs.name.toLowerCase() !== 'name') {
            return -1;
          }
          if (lhs.name.toLowerCase() !== 'name' && rhs.name.toLowerCase() === 'name') {
            return 1;
          }
          if (lhs.name.toLowerCase() === 'name' && rhs.name.toLowerCase() === 'name') {
            return 0;
          }
          if (lhs.name.toLowerCase().indexOf('name') >= 0 && lhs.name.indexOf('.') === -1 &&
            (rhs.name.toLowerCase().indexOf('name') === -1 || rhs.name.indexOf('.') >= 0)) {
            return -1;
          }
          if (rhs.name.toLowerCase().indexOf('name') >= 0 && rhs.name.indexOf('.') === -1 &&
            (lhs.name.toLowerCase().indexOf('name') === -1 || lhs.name.indexOf('.') >= 0)) {
            return 1;
          }
          if (lhs.lookup && !rhs.lookup) {
            return -1;
          }
          if (!lhs.lookup && rhs.lookup) {
            return 1;
          }
          if (lhs.lookup && rhs.lookup) {
            return 0;
          }
          if (lhs.type === 'string' && rhs.type !== 'string') {
            return -1;
          }
          if (lhs.type !== 'string' && rhs.type === 'string') {
            return 1;
          }
          if (lhs.type === 'string' && rhs.type === 'string') {
            return 0;
          }
          if (lhs.type === 'date' && rhs.type !== 'date') {
            return -1;
          }
          if (lhs.type !== 'date' && rhs.type === 'date') {
            return 1;
          }
          if (lhs.type === 'date' && rhs.type === 'date') {
            return 0;
          }
          return 0;
        });

        for (const idxInput of idx.input) {
          const cur: any = {
            name: idxInput.name,
            type: idxInput.type,
          };
          if (idxInput.lookup) {
            cur.lookup = idxInput.lookup;
            cur.lookup.table = cur.lookup.table.replace('dbo.', '').toLowerCase();
            cur.lookup.service = idx.path.substring(14);
            cur.lookup.service = cur.lookup.service.substring(0, cur.lookup.service.indexOf('/')) + '.' + cur.lookup.table;
            while (cur.lookup.service.indexOf('.') > 0) {
              cur.lookup.service = cur.lookup.service.replace('.', '_');
            }
          }
          tmp.input.push(cur);
        }
      }
      if (idx.output && idx.output.length > 0) {
        idx.output.sort((lhs, rhs) => {
          if (lhs.name.toLowerCase() === 'name' && rhs.name.toLowerCase() !== 'name') {
            return -1;
          }
          if (lhs.name.toLowerCase() !== 'name' && rhs.name.toLowerCase() === 'name') {
            return 1;
          }
          if (lhs.name.toLowerCase() === 'name' && rhs.name.toLowerCase() === 'name') {
            return 0;
          }
          if (lhs.name.toLowerCase().indexOf('name') >= 0 && lhs.name.indexOf('.') === -1 &&
            (rhs.name.toLowerCase().indexOf('name') === -1 || rhs.name.indexOf('.') >= 0)) {
            return -1;
          }
          if (rhs.name.toLowerCase().indexOf('name') >= 0 && rhs.name.indexOf('.') === -1 &&
            (lhs.name.toLowerCase().indexOf('name') === -1 || lhs.name.indexOf('.') >= 0)) {
            return 1;
          }
          if (lhs.lookup && !rhs.lookup) {
            return -1;
          }
          if (!lhs.lookup && rhs.lookup) {
            return 1;
          }
          if (lhs.lookup && rhs.lookup) {
            return 0;
          }
          if (idx.type === 'crud-read') {
            let lhsIsLinked = false;
            if (lhs.name.indexOf('.') > 0) {
              const firstSplit = lhs.name.split('.')[0];
              const urlSplit = idx.path.split('/');
              if (firstSplit !== urlSplit[urlSplit.length]) {
                lhsIsLinked = true;
              }
            }
            let rhsIsLinked = false;
            if (rhs.name.indexOf('.') > 0) {
              const firstSplit = rhs.name.split('.')[0];
              const urlSplit = idx.path.split('/');
              if (firstSplit !== urlSplit[urlSplit.length]) {
                rhsIsLinked = true;
              }
            }
            if (lhsIsLinked && !rhsIsLinked) {
              return -1;
            }
            if (!lhsIsLinked && rhsIsLinked) {
              return 1;
            }
            if (lhsIsLinked && rhsIsLinked) {
              return 0;
            }
          }
          if (lhs.type === 'string' && rhs.type !== 'string') {
            return -1;
          }
          if (lhs.type !== 'string' && rhs.type === 'string') {
            return 1;
          }
          if (lhs.type === 'string' && rhs.type === 'string') {
            return 0;
          }
          if (lhs.type === 'date' && rhs.type !== 'date') {
            return -1;
          }
          if (lhs.type !== 'date' && rhs.type === 'date') {
            return 1;
          }
          if (lhs.type === 'date' && rhs.type === 'date') {
            return 0;
          }
          return 0;
        });
        for (const idxOutput of idx.output) {
          const cur: any = {
            name: idxOutput.name,
            type: idxOutput.type || tmp.input[idxOutput.name + '.eq'],
          };
          if (idxOutput.lookup) {
            cur.lookup = idxOutput.lookup;
            cur.lookup.table = cur.lookup.table.replace('dbo.', '').toLowerCase();
            cur.lookup.service = idx.path.substring(14);
            cur.lookup.service = cur.lookup.service.substring(0, cur.lookup.service.indexOf('/')) + '.' + cur.lookup.table;
            while (cur.lookup.service.indexOf('.') > 0) {
              cur.lookup.service = cur.lookup.service.replace('.', '_');
            }
          }
          tmp.output.push(cur);
        }
      }
      result.push(tmp);
    }
    return result;
  }
}
