
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
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
