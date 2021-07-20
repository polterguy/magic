
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

/**
 * Model returned by Bazar when invoking and starting purchasing workflow.
 */
export class PurchaseStatus {

  /**
   * Status of request.
   */
  status: string;

  /**
   * PayPal re-direct URL where user needs to go to actually pay for app.
   */
  url: string;
}
