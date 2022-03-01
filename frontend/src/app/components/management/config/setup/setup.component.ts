
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { MatStepper } from '@angular/material/stepper';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

// Application specific imports.
import { Status } from 'src/app/models/status.model';
import { Message } from 'src/app/models/message.model';
import { Messages } from 'src/app/models/messages.model';
import { MessageService } from 'src/app/services/message.service';
import { FeedbackService } from '../../../../services/feedback.service';
import { ConfigService } from 'src/app/components/management/config/services/config.service';

/**
 * Component responsible for allowing user to setup system.
 */
@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit, OnDestroy {

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
   * @param feedbackService Needed to be able provide feedback to user during process
   * @param configService Needed to be able to retrieve configuration settings and setup process status from backend
   * @param messageService Service used to publish messages to other components in the system
   */
  constructor(
    private feedbackService: FeedbackService,
    private configService: ConfigService,
    protected messageService: MessageService) {
  }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Subscribing to the setup state changed message, to make sure we change UI.
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {

      // Checking if this is an interesting message.
      if (msg.name === Messages.SETUP_STATE_CHANGED) {

        this.configService.status().subscribe((status: Status) => {
          this.status = status;

          // Retrieving next step's selected index for stepper.
          const selectedIndex = this.getStepperSelectedIndex();
          if (selectedIndex === 3) {

            // We're done, giving user some feedback and encouraging him to run assumptions.
            this.feedbackService.showInfo('You have successfully setup Magic, now please verify integrity by running assumptions');

          } else {

            // More steps to go.
            this.stepper.selectedIndex = selectedIndex;
          }

          // Checking if configuration is done.
          if (status.config_done && status.magic_crudified && status.server_keypair) {
            this.configService.changeStatus(true);
          }
      });
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
    return 3;
  }
}
