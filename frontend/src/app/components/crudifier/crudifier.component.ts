
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system types of imports.
import {
  Component,
  ComponentFactoryResolver,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Subscription } from 'rxjs';

// Application specific imports.
import { InjectDirective } from './inject.directive';
import { MessageService } from 'src/app/services/message.service';
import { Message } from 'src/app/models/message.model';
import { Messages } from 'src/app/models/messages.model';

/**
 * Crudifier component for creating applications.
 */
@Component({
  selector: 'app-crudifier',
  templateUrl: './crudifier.component.html',
  styleUrls: ['./crudifier.component.scss']
})
export class CrudifierComponent implements OnInit, OnDestroy {

  /**
   * Message subscription, required to handle messages sent by other components.
   */
  private subscription: Subscription;

  /**
   * Needed to be able to dynamically inject components into container.
   */
  @ViewChild(InjectDirective) injectComp: InjectDirective;

  /**
   * If true, we have dynamically injected a component into container,
   * which was done by children components, due to needing to show additional
   * information.
   */
  public hasComponent = false;

  /**
   * Creates a new instance of your component.
   * 
   * @param resolver Needed to be able to dynamically inject components created by sub-components
   * @param messageService Needed to subscribe to messages sent by other components
   */
  public constructor(
    private resolver: ComponentFactoryResolver,
    private messageService: MessageService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Making sure we subscribe to the "component created" event.
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {

      // Verifying this is the correct message.
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
      } else if (msg.name === Messages.REMOVE_COMPONENT) {

        /*
         * Somebody wants us to remove our dynamically injected component.
         */
        this.hasComponent = false;
        this.injectComp.viewContainerRef.clear();
      }
    });
  }

  /**
   * Implementation of OnDestroy.
   */
  public ngOnDestroy() {

    // Making sure we unsubscribe to existing subscription.
    this.subscription.unsubscribe();
  }

  /**
   * Invoked when active tab is changed.
   */
  public selectedTabChanged() {

    // Clearing additional components out, and making sure we no longer display card.
    this.hasComponent = false;
    this.injectComp.viewContainerRef.clear();
  }
}
