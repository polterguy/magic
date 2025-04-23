
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, OnInit } from '@angular/core';
import { GeneralService } from 'src/app/services/general.service';

// CodeMirror options.
import { CrudifyService } from 'src/app/services/crudify.service';
import json from 'src/app/resources/options/json.json'
import { CodemirrorActionsService } from 'src/app/services/codemirror-actions.service';

/**
 * OpenAPI generator component, allowing user to create Hyperlambda OpenAPI wrappers.
 */
@Component({
  selector: 'app-open-api-generator',
  templateUrl: './open-api-generator.component.html',
  styleUrls: ['./open-api-generator.component.scss']
})
export class OpenAPIGeneratorComponent implements OnInit {

  openAPIURL: string = null;
  openAPISpec: string = null;
  moduleName: string = null;
  baseUrl: string = null;
  cmOptions = {
    json: json,
  };

  constructor(
    private generalService: GeneralService,
    private crudifyService: CrudifyService,
    private codemirrorActionsService: CodemirrorActionsService) { }

  ngOnInit() {

    const options = this.codemirrorActionsService.getActions(null, 'json');
    options.autofocus = false;
    this.cmOptions.json = options;
  }

  openApiUrlChanged() {

    // Sanity checking input.
    if (!this.openAPIURL.startsWith('http://') && !this.openAPIURL.startsWith('https://')) {
      this.generalService.showFeedback('Not a valid URL', 'errorMessage');
      return;
    }

    // Figuring out a default module name.
    const splits1 = this.openAPIURL.split('//');
    const splits2 = splits1[1].split('/');
    this.baseUrl = splits1[0] + '//' + splits2[0];
    let defaultModuleName = splits2[0];
    while (defaultModuleName.indexOf('.') > 0) {
      defaultModuleName = defaultModuleName.replace('.', '_');
    }
    this.moduleName = defaultModuleName;

    this.generalService.showLoading();
    this.crudifyService.getOpenAPISpec(this.openAPIURL).subscribe({

      next: (result: any) => {

        this.openAPISpec = JSON.stringify(result, null, 2);
        this.generalService.hideLoading();
        this.openAPIURL = '';
      },

      error: (error: any) => {

        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  generateHyperlambda() {

    // Basic sanity check of OpenAPI spec.
    const obj = JSON.parse(this.openAPISpec);
    if (!this.baseUrl || this.baseUrl === '') {
      if (!obj.servers || obj.servers.length === 0 || !obj.servers[0].url || (!obj.servers[0].url.startsWith('https://') && !obj.servers[0].url.startsWith('http://'))) {

        this.generalService.showFeedback('Your OpenAPI specification does not contain a root URL', 'errorMessage');
        return;
      }
    }

    this.generalService.showLoading();
    this.crudifyService.generateOpenAPIWrappers(
      this.openAPISpec,
      this.moduleName,
      this.baseUrl).subscribe({

      next: () => {

        this.generalService.hideLoading();
        this.generalService.showFeedback('Module successfully created', 'successMessage');
      },

      error: (error: any) => {

        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }
}
