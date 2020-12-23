
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { MatStepper } from '@angular/material/stepper';
import { Component, Injector, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

// Application specific imports.
import { BaseComponent } from '../../base.component';
import { Status } from 'src/app/models/status.model';
import { ConfigService } from 'src/app/services/config.service';
import { Message, Messages } from 'src/app/models/message.model';
import { MessageService } from 'src/app/services/message.service';

/**
 * Component responsible for allowing user to setup system.
 */
@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent extends BaseComponent implements OnInit, OnDestroy {

  // Stepper instance.
  @ViewChild('stepper') stepper: MatStepper;

  // Subscription for message service.
  private subscription: Subscription;

  /**
   * Provided by parent component during creation of component.
   * Contains the status of setup process.
   */
  @Input() public status: Status;

  /**
   * Creates an instance of your component.
   * 
   * @param router Needed to be able to navigate user to home component after setup is complete
   * @param configService Needed to be able to retrieve configuration settings and setup process status from backend
   * @param messageService Service used to publish messages to other components in the system
   */
  constructor(
    private router: Router,
    private configService: ConfigService,
    protected injector: Injector,
    protected messageService: MessageService) {
    super(injector);
  }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Subscribing to the setup state changed message, to make sure we change UI.
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {

      // Checking if this is an interesting message.
      switch (msg.name) {

        case Messages.SETUP_STATE_CHANGED:
          this.configService.status().subscribe((status: Status) => {
            this.status = status;

            // Retrieving next step's selected index for stepper.
            const selectedIndex = this.getStepperSelectedIndex();
            if (selectedIndex === -1) {

              // We're done, navigating to home component, and giving user some feedback.
              this.showInfo('You have successfully setup Magic');
              this.router.navigate(['/']);
            } else {

              // More steps to go.
              this.stepper.selectedIndex = selectedIndex;
            }
          });
          break;
      }
    });
  }

  /**
   * Implementation of OnDestroy.
   */
  public ngOnDestroy() {

    // Unsubscribing to message subscription.
    this.subscription.unsubscribe();
  }

  /**
   * Returns the selected index of the material stepper according
   * to how far into the setup process we've come.
   */
  public getStepperSelectedIndex() {

    // Changing active step of stepper according to how much of setup process we've done.
    if (!this.status.config_done) {
      return 0;
    } else if (!this.status.magic_crudified) {
      return 1;
    } else if (!this.status.server_keypair) {
      return 2;
    }
    return -1;
  }
}
