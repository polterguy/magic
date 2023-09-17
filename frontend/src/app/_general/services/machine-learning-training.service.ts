
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import saveAs from 'file-saver';
import { Affected } from 'src/app/models/affected.model';
import { Count } from 'src/app/models/count.model';

// Application specific imports.
import { HttpService } from 'src/app/_general/services/http.service';
import { MagicResponse } from '../models/magic-response.model';
import { GeneralService } from './general.service';
import { QueryArgService } from './query-arg.service';

/**
 * OpenAI service, allowing user to interact with OpenAI.
 */
@Injectable({
  providedIn: 'root'
})
export class MachineLearningTrainingService {

  constructor(
    private httpService: HttpService,
    private generalService: GeneralService,
    private queryArgService: QueryArgService) { }

  /**
   * Returns all training snippets from backend matching filter condition.
   */
  ml_training_snippets(filter?: any) {

    return this.httpService.get<any>('/magic/system/magic/ml_training_snippets' + this.queryArgService.getQueryArgs(filter));
  }

  /**
   * Counts training snippets matching condition.
   */
  ml_training_snippets_count(filter?: any) {

    return this.httpService.get<Count>('/magic/system/magic/ml_training_snippets-count' + this.queryArgService.getQueryArgs(filter));
  }

  /**
   * Updates an existing training snippet.
   */
  ml_training_snippets_update(el: any) {

    return this.httpService.put<MagicResponse>('/magic/system/magic/ml_training_snippets', el);
  }

  /**
   * Updates all training snippet matching filter.
   */
  ml_training_snippets_update_all(filter: any) {

    return this.httpService.put<Affected>('/magic/system/magic/ml_training_snippets_all', filter);
  }

  /**
   * Exports all training snippet matching filter.
   */
  ml_training_snippets_export(filter: any) {

    this.httpService.download(
      '/magic/system/magic/ml_training_snippets_export' +
      this.queryArgService.getQueryArgs(filter)).subscribe({
      next: (res) => {

        const disp = res.headers.get('Content-Disposition');
        let filename = disp.split(';')[1].trim().split('=')[1].replace(/"/g, '');
        const file = new Blob([res.body]);
        saveAs(file, filename);
      },
      error: (error: any) => {

        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }

  /**
   * Exports all leads.
   */
  ml_export_leads(filter: any = null) {

    this.httpService.download(
      '/magic/system/magic/ml_requests_export_leads' +
      (filter?.type ? this.queryArgService.getQueryArgs(filter) : '')).subscribe({
      next: (res) => {

        const disp = res.headers.get('Content-Disposition');
        let filename = disp.split(';')[1].trim().split('=')[1].replace(/"/g, '');
        const file = new Blob([res.body]);
        saveAs(file, filename);
      },
      error: () => {

        this.generalService.showFeedback('No leads were found', 'errorMessage');
      }
    });
  }

  /**
   * Creates a new training snippet.
   */
  ml_training_snippets_create(el: any) {

    return this.httpService.post<MagicResponse>('/magic/system/magic/ml_training_snippets', el);
  }

  /**
   * Deletes an existing training snippet.
   */
  ml_training_snippets_delete(id: number) {

    return this.httpService.delete<MagicResponse>('/magic/system/magic/ml_training_snippets?id=' + id);
  }

  /**
   * Deletes an existing training snippet.
   */
  ml_training_snippets_delete_all(filter: any) {

    return this.httpService.delete<MagicResponse>('/magic/system/magic/ml_training_snippets_all' + this.queryArgService.getQueryArgs(filter));
  }

  /**
   * Returns all types from your backend.
   */
  ml_types(filter?: any) {

    return this.httpService.get<any[]>('/magic/system/magic/ml_types' + this.queryArgService.getQueryArgs(filter));
  }

  /**
   * Counts all types from your backend.
   */
  ml_types_count(filter?: any) {

    return this.httpService.get<Count>('/magic/system/magic/ml_types-count' + this.queryArgService.getQueryArgs(filter));
  }

  /**
   * Creates a new machine learning model declaration.
   */
  ml_types_create(type: any) {

    return this.httpService.post<any[]>('/magic/system/magic/ml_types', type);
  }

  /**
   * Updates an existing machine learning model declaration.
   */
  ml_types_update(type: any) {

    return this.httpService.put<any[]>('/magic/system/magic/ml_types', type);
  }

  /**
   * Deletes an existing machine learning type declaration.
   */
  ml_types_delete(type: string) {

    return this.httpService.delete<any>(
      '/magic/system/magic/ml_types?type=' +
      encodeURIComponent(type));
  }

  /**
   * Returns all requests from backend matching filter condition.
   */
  ml_requests(filter?: any) {

    return this.httpService.get<any>('/magic/system/magic/ml_requests' + this.queryArgService.getQueryArgs(filter));
  }

  /**
   * Counts requests matching condition.
   */
  ml_requests_count(filter?: any) {

    return this.httpService.get<MagicResponse>('/magic/system/magic/ml_requests-count' + this.queryArgService.getQueryArgs(filter));
  }

  /**
   * Deletes an existing machine learning request.
   */
  ml_requests_delete(id: number) {

    return this.httpService.delete<any>('/magic/system/magic/ml_requests?id=' + id);
  }

  /**
   * Updates an existing machine learning request.
   */
  ml_requests_update(type: any) {

    return this.httpService.put<any[]>('/magic/system/magic/ml_requests', type);
  }

  /**
   * Returns all questionnaires from your backend.
   */
  questionnaires(filter?: any) {

    return this.httpService.get<any[]>(
      '/magic/system/magic/questionnaires' +
      this.queryArgService.getQueryArgs(filter));
  }

  /**
   * Counts all questionnaires from your backend.
   */
  questionnaires_count(filter?: any) {

    return this.httpService.get<Count>(
      '/magic/system/magic/questionnaires-count' +
      this.queryArgService.getQueryArgs(filter));
  }

  /**
   * Creates a new questionnaires declaration.
   */
  questionnaires_create(value: any) {

    return this.httpService.post<any[]>('/magic/system/magic/questionnaires', value);
  }

  /**
   * Creates a new questionnaires declaration.
   */
  questionnaires_update(value: any) {

    return this.httpService.put<any[]>('/magic/system/magic/questionnaires', value);
  }

  /**
   * Deletes an existing questionnaires declaration.
   */
  questionnaires_delete(name: string) {

    return this.httpService.delete<any>(
      '/magic/system/magic/questionnaires?name=' +
      encodeURIComponent(name));
  }

  /**
   * Returns all questions from your backend for specified type.
   */
  questions(filter?: any) {

    return this.httpService.get<any[]>(
      '/magic/system/magic/questions' +
      this.queryArgService.getQueryArgs(filter));
  }

  /**
   * Saves a new question declaration, expects the specified questions argument to be Markdown,
   * with list items.
   */
  questions_upsert(name: string, questions: string) {

    return this.httpService.put<any>(
      '/magic/system/magic/questions-upsert', {
        name,
        questions,
      });
  }
}
