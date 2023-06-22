
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, EventEmitter, Output } from '@angular/core';

/**
 * Splash info panel component, helping out user to getting started the first
 * time he logs into his or her dashboard.
 */
@Component({
  selector: 'app-splash',
  templateUrl: './splash.component.html',
  styleUrls: ['./splash.component.scss']
})
export class SplashComponnt {

  @Output() hideInfoPanel = new EventEmitter<any>();

  public hidePanel() {

    this.hideInfoPanel.emit();
  }
}
