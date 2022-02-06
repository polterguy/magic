
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Model for verifying user's email address, and any optional promo codes.
 */
export class EmailPromoCodeModel {

  /**
   * Whether user wants to subscribe to our newsletter or not.
   */
  public subscribe: boolean;

  /**
   * Name of customer.
   */
  public name: string;

  /**
   * Email address we should send app's ZIP file to.
   */
  public email: string;

  /**
   * Optional promo code user has been given.
   */
  public code?: any;
}

/**
 * Component for having user provide his email address such that we can send the component
 * to him as a ZIP file.
 */
@Component({
  selector: 'app-confirm-email-address-dialog',
  templateUrl: './confirm-email-address-dialog.component.html',
  styleUrls: ['./confirm-email-address-dialog.component.scss']
})
export class ConfirmEmailAddressDialogComponent implements OnInit {

  /**
   * If true, the user can punch a promo code.
   */
  public has_code: boolean = false;

  /**
   * If this is true user has previously subscribed to newsletter, so we hide the
   * checkbox allowing him to sign up.
   */
  public hideSubscribeCheckBox: boolean = false;

  /**
   * If this is true, user has previously supplied a promo code, and hence
   * we associate current purchase with the same promo code.
   */
  public disablePromoCode: boolean = false;

  /**
   * Creates an instance of your component.
   * 
   * @param data Root user's email address
   */
  constructor(
    private dialogRef: MatDialogRef<ConfirmEmailAddressDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EmailPromoCodeModel) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Checking if user has previously ordered a product, at which point we use previously submitted data.
    const data = localStorage.getItem('confirm-email-data');
    if (data && data !== '') {

      // Updating model.
      const dataObj = JSON.parse(data);
      this.data.code = dataObj.code && dataObj.code !== '' ? dataObj.code : null;
      this.data.email = dataObj.email;
      this.data.name = dataObj.name;
      this.data.subscribe = dataObj.subscribe;
      if (this.data.code) {
        this.has_code = true;
        this.disablePromoCode = true;
      }
    }

    // Checking if user has previously subscribed to our newsletter, at which point we hide the checkbox for subscribing
    const subscribingStr = localStorage.getItem('subscribes-to-newsletter');
    if (subscribingStr && subscribingStr !== '') {
      this.hideSubscribeCheckBox = JSON.parse(subscribingStr).subscribing;
    }
  }

  /**
   * Invoked when user confirms his email address.
   */
  public ok() {

    // Saving data in local storage to simplify process later.
    localStorage.setItem('confirm-email-data', JSON.stringify(this.data));

    // Closing dialog.
    this.dialogRef.close(this.data);
  }

  /**
   * Invoked when user cancels the purchasing process.
   */
   public cancel() {

    // Closing dialog.
    this.dialogRef.close();
  }
}
