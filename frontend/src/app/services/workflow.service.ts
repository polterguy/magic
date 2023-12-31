
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
   * Returns all workflows.
   */
  getWorkflows() {

    return this.httpService.get<any[]>('/magic/system/workflows/workflows');
  }

  /**
   * Returns a list of all workflow actions.
   */
  getWorkflowActions() {

    return this.httpService.get<any[]>('/magic/system/workflows/actions');
  }

  /**
   * Returns a list of all workflow snippets.
   */
  getWorkflowSnippets() {

    return this.httpService.get<any[]>('/magic/system/workflows/snippets');
  }

  /**
   * Adds the specified args to the specified Hyperlambda and returns the transformed result.
   */
  getActionHyperlambda(filename: string, args: any = null) {

    return this.httpService.post<MagicResponse>(
      '/magic/system/workflows/get-hyperlambda', {
        filename,
        args,
      });
  }

  /**
   * Returns the arguments the specified workflow action can handle.
   */
  getArgumentsToAction(action: string, hyperlambda: string = null) {

    return this.httpService.post<any>('/magic/system/workflows/get-action-arguments', {
      'action-file': action,
      hyperlambda,
    });
  }

  /**
   * Applies the specified arguments to the specified Hyperlambda and returns to caller.
   */
  applyArguments(hyperlambda: string, description: string, args: any) {

    return this.httpService.post<MagicResponse>('/magic/system/workflows/apply-arguments', {
      hyperlambda,
      description,
      args,
    });
  }

  /**
   * Returns the arguments the specified Hyperlambda can handle.
   */
  getArguments(hyperlambda: string) {

    return this.httpService.post<any>('/magic/system/workflows/get-hyperlambda-arguments', {
      hyperlambda,
    });
  }
}
