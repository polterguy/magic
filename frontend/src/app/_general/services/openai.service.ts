
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
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
export class OpenAIService {

  /**
   * Creates an instance of your service.
   *
   * @param httpService HTTP service to use for backend invocations
   */
  constructor(private httpService: HttpService) { }

  /**
   * Invokes OpenAI with the specified query.
   */
  query(query: string) {
    return this.httpService.get<Response>(
      '/magic/system/openai/prompt?query=' +
      encodeURIComponent(query));
  }

  /**
   * Returns true if OpenAI has been configured.
   */
  enabled() {
    return this.httpService.get<any>('/magic/system/openai/enabled');
  }

  /**
   * Configures OpenAI with the specified API key, and optionally starts
   * training it using the default training set.
   */
  configure(key: string, model: string, max_tokens: number, temperature: number) {
    return this.httpService.post<any>('/magic/system/openai/configure', {
      key,
      model,
      max_tokens,
      temperature,
    });
  }

  /**
   * Returns OpenAI API key to caller.
   */
  key() {
    return this.httpService.get<any>('/magic/system/openai/api-key');
  }

  /**
   * Returns all possible base models user can use.
   */
  base_models() {
    return this.httpService.get<string[]>('/magic/system/openai/base-models');
  }

  /**
   * Returns default training to caller.
   */
  get_training_data() {
    return this.httpService.get<any[]>('/magic/system/openai/training-data');
  }

  /**
   * Starts training
   */
  start_training(content: string) {
    return this.httpService.post<Response>('/magic/system/openai/train', {
      content
    });
  }

  get_training_status() {
    return this.httpService.get<any[]>('/magic/system/openai/training-sessions');
  }
}
