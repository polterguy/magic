
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

  list() {
    return this.httpService.get<any>('/magic/system/magic/training_snippets');
  }
}
