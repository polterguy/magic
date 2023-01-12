
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { Response } from 'src/app/models/response.model';

// Application specific imports.
import { HttpService } from 'src/app/_general/services/http.service';

/**
 * OpenAI service, allowing user to interact with OpenAI.
 */
@Injectable({
  providedIn: 'root'
})
export class MachineLearningTrainingService {

  constructor(private httpService: HttpService) { }

  /**
   * Returns all training snippets from backend matching filter condition.
   */
  ml_training_snippets(filter?: any) {
    return this.httpService.get<any>('/magic/system/magic/ml_training_snippets' + this.getQueryArgs(filter));
  }

  /**
   * Counts training snippets matching condition.
   */
  ml_training_snippets_count(filter?: any) {
    return this.httpService.get<Response>('/magic/system/magic/ml_training_snippets-count' + this.getQueryArgs(filter));
  }

  /**
   * Updates an existing training snippet.
   */
  ml_training_snippets_update(el: any) {
    return this.httpService.put<Response>('/magic/system/magic/ml_training_snippets', el);
  }

  /**
   * Creates a new training snippet.
   */
  ml_training_snippets_create(el: any) {
    return this.httpService.post<Response>('/magic/system/magic/ml_training_snippets', el);
  }

  /**
   * Deletes an existing training snippet.
   */
  ml_training_snippets_delete(id: number) {
    return this.httpService.delete<Response>('/magic/system/magic/ml_training_snippets?id=' + id);
  }

  /**
   * Returns all distinct types of training snippets from your backend.
   */
  ml_types(filter?: any) {
    return this.httpService.get<any[]>('/magic/system/magic/ml_types' + this.getQueryArgs(filter));
  }

  /**
   * Creates a new machine learning type declaration.
   */
  ml_types_create(type: any) {
    return this.httpService.post<any[]>('/magic/system/magic/ml_types', type);
  }

  /**
   * Deletes an existing machine learning type declaration.
   */
  ml_types_delete(type: string) {
    return this.httpService.delete<any>(
      '/magic/system/magic/ml_types?type=' +
      encodeURIComponent(type));
  }

  /*
   * Private helper methods.
   */

  /*
   * Creates QUERY parameters from the specified "args" argument given.
   *
   * Used by CRUD service methods to create the correct QUERY parameters
   * during invocations towards your backend.
   */
  private getQueryArgs(args: any) {
    let result = '';
    for(const idx in args || {}) {
      if (Object.prototype.hasOwnProperty.call(args, idx)) {
        const idxFilter = args[idx];
        if (idxFilter !== null && idxFilter !== undefined && idxFilter !== '') {
          if (result === '') {
            result += '?';
          } else {
            result += '&';
          }
          if (idx.endsWith('.like') && idxFilter.indexOf('%') === -1) {
            result += idx + '=' + encodeURIComponent(idxFilter + '%');
          } else {
            result += idx + '=' + encodeURIComponent(idxFilter);
          }
        }
      }
    }
    return result;
  }
}
