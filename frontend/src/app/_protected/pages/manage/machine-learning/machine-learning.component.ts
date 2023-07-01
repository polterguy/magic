
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, OnInit } from '@angular/core';
import { ConfigService } from 'src/app/_general/services/config.service';
import { GeneralService } from 'src/app/_general/services/general.service';

/**
 * Helper component to manage Machine Learning training snippets, and types.
 */
@Component({
  selector: 'app-machine-learning',
  templateUrl: './machine-learning.component.html',
  styleUrls: ['./machine-learning.component.scss']
})
export class MachineLearningComponent implements OnInit {

  isConfigured: boolean = false;
  sqlIte: boolean = false;

  constructor(
    private configService: ConfigService,
    private generalService: GeneralService) { }

  ngOnInit() {

    // Checking if cloudlet is using SQLite as default database.
    this.generalService.showLoading();
    this.configService.getDatabases().subscribe({

      next: (result: any) => {

        this.sqlIte = result.default === 'sqlite';
        this.generalService.hideLoading();
      },

      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }
}
