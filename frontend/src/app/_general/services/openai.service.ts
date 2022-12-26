
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
}
