
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
  subscribe: boolean;

  /**
   * Name of customer.
   */
  name: string;

  /**
   * Email address we should send app's ZIP file to.
   */
  email: string;

  /**
   * Optional promo code user has been given.
   */
  code?: any;
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
  has_code: boolean = false;

  /**
   * If this is true user has previously subscribed to newsletter, so we hide the
   * checkbox allowing him to sign up.
   */
  hideSubscribeCheckBox: boolean = false;

  /**
   * If this is true, user has previously supplied a promo code, and hence
   * we associate current purchase with the same promo code.
   */
  disablePromoCode: boolean = false;

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to be able to explicitly close dialog
   * @param data Root user's email address
   */
  constructor(
    private dialogRef: MatDialogRef<ConfirmEmailAddressDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EmailPromoCodeModel) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    const data = localStorage.getItem('confirm-email-data');
    if (data && data !== '') {
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
    const subscribingStr = localStorage.getItem('subscribes-to-newsletter');
    if (subscribingStr && subscribingStr !== '') {
      this.hideSubscribeCheckBox = JSON.parse(subscribingStr).subscribing;
    }
  }

  /**
   * Invoked when user confirms his email address.
   */
  ok() {
    localStorage.setItem('confirm-email-data', JSON.stringify(this.data));
    this.dialogRef.close(this.data);
  }

  /**
   * Invoked when user cancels the purchasing process.
   */
  cancel() {
    this.dialogRef.close();
  }
}
