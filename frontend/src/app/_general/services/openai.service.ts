
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
export class OpenAIService {

  constructor(private httpService: HttpService) { }

  query(query: string) {
    return this.httpService.get<Response>(
      '/magic/system/openai/prompt?query=' +
      encodeURIComponent(query));
  }

  enabled() {
    return this.httpService.get<any>('/magic/system/openai/enabled');
  }

  configure(key: string, model: string, max_tokens: number, temperature: number) {
    return this.httpService.post<any>('/magic/system/openai/configure', {
      key,
      model,
      max_tokens,
      temperature,
    });
  }

  key() {
    return this.httpService.get<any>('/magic/system/openai/api-key');
  }

  base_models() {
    return this.httpService.get<string[]>('/magic/system/openai/base-models');
  }

  get_training_data() {
    return this.httpService.get<any[]>('/magic/system/openai/training-data');
  }

  start_training() {
    return this.httpService.post<Response>('/magic/system/openai/train', {});
  }

  get_training_status() {
    return this.httpService.get<any[]>('/magic/system/openai/training-sessions');
  }
}
