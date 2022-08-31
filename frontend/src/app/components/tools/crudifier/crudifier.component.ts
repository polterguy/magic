
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system types of imports.
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Subscription } from 'rxjs';

// Application specific imports.
import { InjectDirective } from './inject.directive';
import { Message } from 'src/app/models/message.model';
import { Messages } from 'src/app/models/messages.model';
import { MessageService } from 'src/app/services/message.service';
import { BackendService } from 'src/app/services/backend.service';
import { ActivatedRoute } from '@angular/router';

/**
 * Crudifier component for crudifying apps.
 */
@Component({
  selector: 'app-crudifier',
  templateUrl: './crudifier.component.html'
})
export class CrudifierComponent implements OnInit, OnDestroy {

  // Message subscription, required to handle messages sent by other components.
  private subscription: Subscription;

  /**
   * Active tab.
   */
  activeTab: number = 0;

  /**
   * Needed to be able to dynamically inject components into container.
   */
  @ViewChild(InjectDirective) injectComp: InjectDirective;

  /**
   * If true, we have dynamically injected a component into container,
   * which was done by children components, due to needing to show additional
   * information.
   */
  hasComponent = false;

  /**
   * Creates a new instance of your component.
   *
   * @param backendService Needed to retrieve user's access rights in backend
   * @param messageService Needed to subscribe to messages sent by other components
   */
  constructor(
    public backendService: BackendService,
    private messageService: MessageService,
    private activatedRouter: ActivatedRoute) {
      this.activatedRouter.queryParams.subscribe((param: any) => {
        if (param.type && param.type === 'frontend') {
          setTimeout(() => {
            this.activeTab = 2;
          }, 300);
        }
      })
     }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {
      if (msg.name === Messages.INJECT_COMPONENT) {

        /*
         * Somebody wants us to dynamically inject a component, making sure we display
         * card, create component, and decorate component according to inputs specified.
         */
        this.hasComponent = true;
        const componentRef = this.injectComp.viewContainerRef.createComponent(msg.content.componentFactory);
        for (const idx in msg.content.data) {
          componentRef.instance[idx] = msg.content.data[idx];
        }

      } else if (msg.name === Messages.CLEAR_COMPONENTS) {

        // Somebody wants us to remove our dynamically injected component.
        this.hasComponent = false;
        this.injectComp.viewContainerRef.clear();

      } else if (msg.name === 'magic.crud-generator.activate-frontend') {
        if (this.backendService.active?.access.crud.generate_frontend) {
          this.activeTab = 2;
        }
      }
    });

    if (this.backendService.active?.access.crud.generate_crud) {
      this.activeTab = 0;
    } else if (this.backendService.active?.access.crud.generate_sql) {
      this.activeTab = 1;
    } else if (this.backendService.active?.access.crud.generate_frontend) {
      this.activeTab = 2;
    }
  }

  /**
   * Implementation of OnDestroy.
   */
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /**
   * Invoked when active tab is changed.
   */
  selectedTabChanged() {
    this.hasComponent = false;
    this.injectComp.viewContainerRef.clear();
  }
}
