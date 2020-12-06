
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { Messages } from 'src/app/models/message.model';
import { ConfigService } from 'src/app/services/config.service';
import { BaseComponent } from 'src/app/components/base.component';
import { MessageService } from 'src/app/services/message.service';

/**
 * Component allowing user to setup a cryptography key pair.
 */
@Component({
  selector: 'app-setup-crypto',
  templateUrl: './setup-crypto.component.html',
  styleUrls: ['./setup-crypto.component.scss']
})
export class SetupCryptoComponent extends BaseComponent implements OnInit {

  /**
   * CSRNG seed used when generating cryptography key.
   */
  public seed: string = null;

  /**
   * Strength of key pair to generate.
   */
  public strength = 4096;

  /**
   * Creates an instance of your component.
   * 
   * @param messageService Message service used to publish messages to other components.
   */
  public constructor(
    private configService: ConfigService,
    protected messageService: MessageService) {
    super(messageService);
  }

  /**
   * OnInit implementation.
   */
  ngOnInit() {

    // Getting some initial random gibberish to use as seed when generating key pair.
    this.configService.getGibberish(40, 50).subscribe((res: any) => {
      this.seed = res.result;
    }, (error: any) => this.showError(error));
  }

  /**
   * Generates a cryptography server key pair.
   */
  public generate() {
    this.configService.generateKeyPair(this.strength, this.seed).subscribe((res: any) => {
      this.messageService.sendMessage({
        name: Messages.SETUP_STATE_CHANGED,
        content: 'crypto'
      });
    });
  }
}
