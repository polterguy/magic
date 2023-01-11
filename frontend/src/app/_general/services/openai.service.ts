
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
  name: string;
  description: string;
}

/**
 * OpenAI service, allowing user to interact with OpenAI.
 */
@Injectable({
  providedIn: 'root'
})
export class OpenAIService {

  constructor(private httpService: HttpService) { }

  query(query: string, lang: string = null) {
    let filter = '?query=' + encodeURIComponent(query);
    if (lang && lang !== 'hl') {
      filter += '&model=text-davinci-003'
    }
    return this.httpService.get<Response>(
      '/magic/system/openai/prompt' + filter);
  }

  isConfigured() {
    return this.httpService.get<{ result: boolean }>('/magic/system/openai/is-configured');
  }

  configure(model: string, max_tokens: number, temperature: number) {
    return this.httpService.post<any>('/magic/system/openai/configure', {
      model,
      max_tokens,
      temperature,
    });
  }

  key() {
    return this.httpService.get<any>('/magic/system/openai/api-key');
  }

  setKey(key: string) {
    return this.httpService.post<any>('/magic/system/openai/key', {
      key,
    });
  }

  models() {
    return this.httpService.get<OpenAIModel[]>('/magic/system/openai/models');
  }

  start_training() {
    return this.httpService.post<Response>('/magic/system/openai/train', {});
  }

  get_training_status() {
    return this.httpService.get<any[]>('/magic/system/openai/training-sessions');
  }
}
