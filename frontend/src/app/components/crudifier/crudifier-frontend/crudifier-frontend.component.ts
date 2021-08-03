
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { Component, ComponentFactoryResolver, OnInit } from '@angular/core';

// Application specific imports.
import { Messages } from 'src/app/models/messages.model';
import { BackendService } from 'src/app/services/backend.service';
import { MessageService } from 'src/app/services/message.service';
import { EndpointService } from '../../endpoints/services/endpoint.service';
import { CrudifierFrontendExtraComponent } from './crudifier-frontend-extra/crudifier-frontend-extra.component';

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
   * Name user wants to use for his app.
   */
  public name = '';

  /**
   * The API URL to bind the frontend towards.
   */
  public apiUrl = '';

  /**
   * Copyright notice to use for generated files.
   */
  public copyright = '';

  /**
   * Creates an instance of your component.
   * 
   * @param resolver Needed to be able to create component factory to create dynamically inject extra information component
   * @param endpointService Needed to retrieve templates, meta information, and actually generate frontend
   * @param messageService Needed to be able to publish messages for creating child component
   * @param backendService Needed to populate the default value of the API URL.
   */
  constructor(
    private resolver: ComponentFactoryResolver,
    private endpointService: EndpointService,
    private messageService: MessageService,
    private backendService: BackendService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Invoking backend to retrieve templates.
    this.endpointService.templates().subscribe((result: string[]) => {

      // Assigning result of invocation to model.
      this.templates = result || [];
    });

    // Defaulting API URL to current backend's URL.
    this.apiUrl = this.backendService.current.url;
  }

  /**
   * Invoked when user selects a template.
   */
   public templateChanged() {

    // Creating our dynamically injected extra component.
    // Making sure parent clears it dynamic container in case it's already got another container.
    this.messageService.sendMessage({
      name: Messages.CLEAR_COMPONENTS,
    });

    // Creating our component.
    const componentFactory = this.resolver.resolveComponentFactory(CrudifierFrontendExtraComponent);

    // Signaling listener, passing in component as data.
    this.messageService.sendMessage({
      name: Messages.INJECT_COMPONENT,
      content: {
        componentFactory,
        data: {
          template: this.template
        }
      }
    });
  }

  /**
   * Invoked when user clicks the generate button.
   */
  public generate() {

    // Signaling child component to do the actual creation.
    this.messageService.sendMessage({
      name: 'app.generator.generate-frontend',
      content: {
        template: this.template,
        name: this.name,
        copyright: this.copyright,
        apiUrl: this.apiUrl
      }
    });
  }
}
