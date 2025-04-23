
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { FileService } from 'src/app/services/file.service';
import { GeneralService } from 'src/app/services/general.service';

/**
 * Dialogue to show user what's new in Magic.
 */
@Component({
  selector: 'app-whats-new',
  templateUrl: './whats-new.component.html',
  styleUrls: ['./whats-new.component.scss']
})
export class WhatsNewDialogComponent implements OnInit {

  changelog: string = null;

  constructor(
    private fileService: FileService,
    private generalService: GeneralService) { }

  ngOnInit() {

    // Retrieving Markdown files from backend.
    this.generalService.showLoading();
    this.fileService.loadFile('/misc/changelog.md').subscribe({

      next: (result: string) => {

        this.generalService.hideLoading();
        this.changelog = result;
      },

      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error.error.message ?? error, 'errorMessage');
      }
    });
  }
}
