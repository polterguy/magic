
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
import { ConfigService } from 'src/app/services/management/config.service';

/**
 * Component responsible for allowing user to setup system.
 */
@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit, OnDestroy {

  // Subscription for message service.
  private subscription: Subscription;

  @ViewChild('stepper') stepper: MatStepper;

  /**
   * Provided by parent component during creation of component.
   * Contains the status of setup process.
   */
  @Input() status: Status;

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
    protected messageService: MessageService) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {
      if (msg.name === Messages.SETUP_STATE_CHANGED) {
        this.configService.status().subscribe({
          next: (status: Status) => {
            this.status = status;
            const selectedIndex = this.getStepperSelectedIndex();
            if (selectedIndex === 3) {
              this.feedbackService.showInfo('You have successfully setup Magic, now please verify integrity by running assumptions');
            } else {
              this.stepper.selectedIndex = selectedIndex;
            }
            if (status.config_done && status.magic_crudified && status.server_keypair) {
              this.configService.changeStatus(true);
            }
          },
          error: (error: any) =>this.feedbackService.showError(error)});
      }
    });
  }

  /**
   * Implementation of OnDestroy.
   */
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /**
   * Returns the selected index of the material stepper according
   * to how far into the setup process we've come.
   */
  getStepperSelectedIndex() {
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
