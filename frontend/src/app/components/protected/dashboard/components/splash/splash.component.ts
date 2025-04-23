
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WhatsNewDialogComponent } from '../whats-new/whats-new.component';
import { BackendService } from 'src/app/services/backend.service';

/**
 * Splash info panel component, helping out user to getting started the first
 * time he logs into his or her dashboard.
 */
@Component({
  selector: 'app-splash',
  templateUrl: './splash.component.html',
  styleUrls: ['./splash.component.scss']
})
export class SplashComponnt implements OnInit {

  @Output() hideInfoPanel = new EventEmitter<any>();
  frontendUrl: string = '';

  constructor(
    private dialog: MatDialog,
    private backendService: BackendService) { }

  ngOnInit() {

    // Updating frontend URL to primary API URL to allow user to easily access frontend.
    this.frontendUrl = this.backendService.active.url;
  }

  hidePanel() {

    this.hideInfoPanel.emit();
  }

  showNew() {

    this.dialog.open(WhatsNewDialogComponent, {
      width: '950px',
      maxWidth: '100%',
    });
  }
}
