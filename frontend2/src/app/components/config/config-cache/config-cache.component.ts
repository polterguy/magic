
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific components.
import { CacheService } from 'src/app/services/cache.service';

/**
 * Cache component for allowing user to inspect, remove and clear cache items.
 */
@Component({
  selector: 'app-config-cache',
  templateUrl: './config-cache.component.html',
  styleUrls: ['./config-cache.component.scss']
})
export class ConfigCacheComponent implements OnInit {

  /**
   * List of cache items as returned from backend.
   */
  public cacheItems: any[] = [];

  /**
   * Creates an instance of your component.
   * 
   * @param cacheService Needed to read, remove and purge cache
   */
  constructor(private cacheService: CacheService) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.cacheService.list().subscribe((items: any[]) => {

      // Dynamically building our dataset.
      const arr = [];
      for(const idx in items) {
        arr.push(idx);
      }
      this.cacheItems = arr.map(x => {
        return {
          key: x
        };
      });
    });
  }
}
