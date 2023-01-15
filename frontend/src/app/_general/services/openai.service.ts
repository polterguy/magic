
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { Response } from 'src/app/models/response.model';

// Application specific imports.
import { HttpService } from 'src/app/_general/services/http.service';

/**
 * OpenAI model.
 */
export class OpenAIModel {
  id: string;
  owned_by: string;
  parent: string;
}

/**
 * OpenAI service, allowing user to interact with OpenAI.
 */
@Injectable({
  providedIn: 'root'
})
export class OpenAIService {

  constructor(private httpService: HttpService) { }

  /**
   * Queries OpenAI with the specified prompt and returns result to caller.
   */
  query(prompt: string, type: string) {
    return this.httpService.get<Response>(
      '/magic/system/openai/prompt?prompt=' +
      encodeURIComponent(prompt) +
      '&type=' +
      encodeURIComponent(type));
  }

  /**
   * Returns true if OpenAI has been configured.
   */
  isConfigured() {
    return this.httpService.get<{ result: boolean }>('/magic/system/openai/is-configured');
  }

  /**
   * Returns OpenAI API key to caller.
   */
  key() {
    return this.httpService.get<any>('/magic/system/openai/key');
  }

  /**
   * Saves the specified OpenAI API key.
   */
  setKey(key: string) {
    return this.httpService.post<any>('/magic/system/openai/key', {
      key,
    });
  }

  /**
   * Returns all models from OpenAI, including fine tuned models and base models.
   */
  models() {
    return this.httpService.get<OpenAIModel[]>('/magic/system/openai/models');
  }

  uploadTrainingFile(data: FormData) {
    return this.httpService.post<any>('/magic/system/openai/upload-training-data', data);
  }

  /**
   * Uploads training data to OpenAI and starts a new training session.
   */
  start_training(data: any) {
    return this.httpService.post<Response>('/magic/system/openai/train', data);
  }

  /**
   * Returns all training sessions to calller.
   */
  get_training_status() {
    return this.httpService.get<any[]>('/magic/system/openai/training-sessions');
  }
}
