
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from 'src/app/services/http.service';
import { MagicResponse } from '../models/magic-response.model';
import { PromptResponse } from '../models/prompt-response.model';
import { BackendService } from './backend.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

/**
 * OpenAI model.
 */
export class OpenAIModel {
  id: string;
  created?: number;
  owned_by?: string;
  parent?: string;
  chat?: boolean;
  tokens?: number;
  vector?: boolean;
}

/**
 * OpenAI service, allowing user to interact with OpenAI.
 */
@Injectable({
  providedIn: 'root'
})
export class OpenAIService {

  constructor(
    private httpService: HttpService,
    private httpClient: HttpClient,
    private backendService: BackendService) { }

  /**
   * Queries OpenAI with the specified prompt and returns result to caller.
   */
  query(
    prompt: string,
    type: string,
    search: boolean = false,
    session: string = null,
    data: string = null) {

    // building our payload
    const payload: any = {
      prompt,
    };
    if (data) {
      payload.data = data;
    }

    // Checking if we're dealing with hyperlambda code, at which point we use ainiro.io's generator
    if (type === 'hl') {

      return this.httpClient.post<PromptResponse>(environment.hyperLambdaGeneratorUrl + '/magic/modules/hyperlambda-generator/chat', payload);

    } else {

      if (session) {
        payload.session = session;
      }
      payload.references = search;
      payload.type = type;
      payload.user_id = this.backendService.active.username;
      return this.httpService.post<PromptResponse>(`/magic/system/openai/chat`, payload);
    }
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
  models(api_key: string = null) {

    let query = '';
    if (api_key) {
      query += '?api_key=' + encodeURIComponent(api_key);
    }
    return this.httpService.get<OpenAIModel[]>('/magic/system/openai/models' + query);
  }

  /**
   * Returns all themes from backend.
   */
  themes() {

    return this.httpService.get<string[]>('/magic/system/openai/themes');
  }

  /**
   * Returns all themes for search from backend.
   */
  themesSearch() {

    return this.httpService.get<string[]>('/magic/system/openai/themes-search');
  }

  /**
   * Uploads the specified training data file to the backend.
   */
  uploadTrainingFile(data: FormData) {

    return this.httpService.post<any>('/magic/system/openai/upload-training-data', data);
  }

  /**
   * Uploads the specified training data file to the backend.
   */
  uploadCsvFile(data: FormData) {

    return this.httpService.post<any>('/magic/system/openai/upload-csv', data);
  }

  /**
   * Uploads the specified URL list file to the backend.
   */
  uploadUrlList(data: FormData) {

    return this.httpService.post<any>('/magic/system/openai/upload-url-list', data);
  }

  /**
   * Uploads the specified image file as training data to the backend.
   */
  uploadImageFile(data: FormData) {

    return this.httpService.post<any>('/magic/system/openai/upload-image', data);
  }

  /**
   * Uploads training data to OpenAI and starts a new training session.
   */
  start_training(data: any) {

    return this.httpService.post<MagicResponse>('/magic/system/openai/train', data);
  }

  /**
   * Returns all completion slots the system supports
   */
  completionSlots() {

    return this.httpService.get<any>('/magic/system/openai/completion-slots');
  }

  /**
   * Returns max tokens for specified completion slot.
   */
  maxTokensForCompletionSlot(slot: string) {

    return this.httpService.get<any>('/magic/system/openai/completion-slot-tokens?slot=' + encodeURIComponent(slot));
  }

  /**
   * Imports the specified URL as training data.
   */
  importUrl(
    url: string,
    type: string,
    delay: number,
    max: number,
    threshold: number,
    summarize: boolean,
    insert_url: boolean,
    feedbackChannel: string,
    images: boolean = true,
    lists: boolean = true,
    code: boolean = true) {

    return this.httpService.post<any>('/magic/system/openai/import-url', {
      url,
      type,
      delay,
      max,
      threshold,
      summarize,
      insert_url,
      images,
      lists,
      code,
      ['feedback-channel']: feedbackChannel,
    });
  }

  /**
   * Imports the specified page as training data.
   */
  importPage(
    url: string,
    type: string,
    threshold: number,
    feedbackChannel: string,
    images: boolean = true,
    lists: boolean = true,
    code: boolean = true) {

    return this.httpService.post<any>('/magic/system/openai/import-page', {
      url,
      type,
      threshold,
      images,
      lists,
      code,
      ['feedback-channel']: feedbackChannel,
    });
  }

  /**
   * Vectorises all snippets in the specified type.
   */
  vectorise(type: string, channel: string) {

    return this.httpService.post<any>('/magic/system/openai/vectorise', {
      type,
      ['feedback-channel']: channel,
    });
  }

  /**
   * Adds the specified content to the specified session.
   */
  addToSession(session:string, content: string) {

    return this.httpService.post<any>('/magic/system/openai/add-to-session', {
      session,
      content,
    });
  }

  /**
   * Get system messsages.
   */
  getSystemMessage() {

    return this.httpService.get<any[]>('/magic/system/openai/system-messages');
  }

  /**
   * Vectorises only the specified snippet.
   */
  vectoriseSnippet(id: number) {

    return this.httpService.post<any>('/magic/system/openai/vectorise-snippet', {
      id,
    });
  }

  /**
   * Creates a system message based upon the specified template, instruction and URL.
   */
  createSystemMessage(instruction: string, template: string, url: string, channel: string) {

    return this.httpService.post<MagicResponse>('/magic/system/openai/create-system-message', {
      instruction,
      template,
      url,
      channel,
    });
  }

  /**
   * Creates a new bot 100% automatically from the specified URL.
   */
  createBot(
    url: string,
    model: string,
    flavor: string,
    max: number,
    autocrawl: boolean,
    auto_destruct: boolean,
    feedbackChannel: string,
    vectorize: boolean,
    instruction?: string) {

    const args: any = {
      url: url,
      model: model,
      ['feedback-channel']: feedbackChannel,
      vectorize: vectorize,
    };
    if (flavor) {
      args.flavor = flavor;
    }
    if (max) {
      args.max = max;
    }
    if (autocrawl) {
      args.autocrawl = autocrawl;
    }
    if (auto_destruct) {
      args.auto_destruct = auto_destruct;
    }
    if (instruction) {
      args.instruction = instruction;
    }
    return this.httpService.post<any>('/magic/system/openai/create-bot', args);
  }

  /**
   * Get available functions.
   */
  getAvailableWorkflows(all: boolean = false) {

    return this.httpService.get<any[]>('/magic/system/openai/available-workflows?private=' + all);
  }

  /**
   * Get available template snippets.
   */
  getAvailableTemplateSnippets() {

    return this.httpService.get<any[]>('/magic/system/openai/available-template-snippets');
  }
}
