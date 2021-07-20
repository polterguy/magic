
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { BazarApp } from './models/bazar-app.model';
import { BazarService } from './services/bazar.service';

/**
 * Bazar component allowing you to obtain additional Micro Service backend
 * modules for your Magic installation.
 */
@Component({
  selector: 'app-bazar',
  templateUrl: './bazar.component.html',
  styleUrls: ['./bazar.component.scss']
})
export class BazarComponent implements OnInit {

  /**
   * Apps as returned from Bazar.
   */
  public apps: BazarApp[] = [];

  /**
   * Creates an instance of your component.
   */
  constructor(private bazarService: BazarService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {
    
    // Retrieving Bazar items from main Bazar.
    this.bazarService.listApps().subscribe((apps: BazarApp[]) => {

      // Assigning result to model.
      this.apps = apps;
    });
  }
}
