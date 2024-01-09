
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Inject, OnInit } from '@angular/core';

// Application specific imports.
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/services/general.service';

/**
 * Modal dialog showing JSON JSON output encapsulating OpenAPI specification.
 */
@Component({
  selector: 'app-openapi-specification-dialog',
  templateUrl: './openapi-specification-dialog.component.html',
  styleUrls: ['./openapi-specification-dialog.component.scss']
})
export class OpenAPISpecifictionDialogComponent {

  /**
   * Creates an instance of your component.
   */
  constructor(
    private clipBoard: Clipboard,
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  copy() {

    this.clipBoard.copy(this.data.json);
    this.generalService.showFeedback('You can find the JSON content on your clipboard', 'successMessage');
  }

  copyUrl() {

    this.clipBoard.copy(this.data.url);
    this.generalService.showFeedback('You can find the URL to the OpenAPI specification on your clipboard', 'successMessage');
  }
}
