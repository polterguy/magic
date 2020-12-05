
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';

// Application specific imports.
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
export class SetupComponent implements OnInit, OnDestroy {

  private subscriber: Subscription;

  @Input() public status: Status;

  /**
   * Creates an instance of your component.
   */
  constructor(
    private messageService: MessageService,
    private configService: ConfigService) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.subscriber = this.messageService.subscriber().subscribe((msg: Message) => {

      switch(msg.name) {

        /*
         * Making sure we subscribe to the setup state changed event,
         * such that we can change which setup component to currently
         * display to user.
         */
        case Messages.SETUP_STATE_CHANGED:
          this.configService.status().subscribe(res => {
            this.status = res;
          });
          break;
      }
    });
  }

  /**
   * Implementation of OnDestroy.
   */
  ngOnDestroy() {
    this.subscriber.unsubscribe();
  }

  /**
   * Returns the percentage of how much more work needs to be
   * done in order to finish the setup process of the system.
   */
  public getSetupProgress() {
    let percentage = 0;
    if (this.status.setup_done) {
      percentage += 33;
    }
    if (this.status.magic_crudified) {
      percentage += 33;
    }
    if (this.status.server_keypair) {
      percentage += 33;
    }
    return percentage;
  }
}
