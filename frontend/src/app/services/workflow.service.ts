
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from 'src/app/services/http.service';
import { MagicResponse } from '../models/magic-response.model';

/**
 * File service allowing you to read, download, upload, and delete files.
 */
@Injectable({
  providedIn: 'root'
})
export class WorkflowService {

  constructor(private httpService: HttpService) { }

  /**
   * Returns a list of all workflow funtions.
   */
  listToolboxItems() {

    return this.httpService.get<any[]>('/magic/system/workflows/functions');
  }

  /**
   * Adds the specified function to the specified Hyperlambda and returns the transformed result.
   */
  getHyperlambda(filename: string) {

    return this.httpService.get<MagicResponse>(
      '/magic/system/workflows/get-hyperlambda?filename=' + 
      encodeURIComponent(filename));
  }
}
