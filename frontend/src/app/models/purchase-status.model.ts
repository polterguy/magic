
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
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
  url?: string;

  /**
   * If purchase is accepted immediately, due to app being free for instance,
   * this will contain the download code, allowing user to download app
   * immediately.
   */
  code?: string;
}
