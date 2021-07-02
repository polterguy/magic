
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Utility imports.
import { ICreateOrderRequest, IPayPalConfig } from 'ngx-paypal';

// Application specific imports.
import { LogService } from '../log/services/log.service';
import { Response } from 'src/app/models/response.model';
import { ConfigService } from '../config/services/config.service';

/**
 * Component showing details and information about system.
 */
@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {

  /**
   * PayPal configuration object.
   */
  public payPalConfig?: IPayPalConfig = null;

  /**
   * Creates an instance of your component.
   */
  public constructor(
    private logService: LogService,
    private configService: ConfigService) { }

  /**
   * Iplementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving PayPal ID from backend.
    this.configService.getPayPalID().subscribe((result: Response) => {

      // Checking if user has already donated ...
      if (result.result !== 'already-donated') {

        // Configuring PayPal ...
        this.payPalConfig = {
          currency: 'EUR',
          clientId: result.result,
          createOrderOnClient: (data) => <ICreateOrderRequest>{
            intent: 'CAPTURE',
            purchase_units: [
              {
                amount: {
                  currency_code: 'EUR',
                  value: '50',
                  breakdown: {
                    item_total: {
                      currency_code: 'EUR',
                      value: '50'
                    }
                  }
                },
                items: [
                  {
                    name: 'Donation to Magic Cloud',
                    quantity: '1',
                    category: 'DIGITAL_GOODS',
                    unit_amount: {
                      currency_code: 'EUR',
                      value: '50',
                    },
                  }
                ]
              }
            ]
          },
          advanced: {
            commit: 'true'
          },
          style: {
            label: 'paypal',
            layout: 'vertical'
          },
          onClientAuthorization: (data) => {
            this.logService.createLogEntry('info', `Donation given to Thomas Hansen, the maintainer of Magic. Amount donated was 50 EUROs`)
          },
        };
      }
    });
  }
}
