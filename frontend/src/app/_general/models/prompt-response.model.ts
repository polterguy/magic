
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

/**
 * Generic model for endpoints not returning anything but
 * a single string value.
 */
export class PromptResponse {

  /**
   * Value as returned from server.
   */
  result: string;

  /**
   * How the model could find its answer. If it was able to correctly
   * use your training data, this will have a value of "stop".
   */
  finish_reason: string;

  /**
   * What source was used to generate the response.
   */
  references?: PromptReference[];

  /**
   * How much time was spent fetching embeddings from database.
   */
  db_time?: string;
}

export class PromptReference {

  /**
   * The URI of the source.
   */
  uri: string;

  /**
   * The prompt value of the source.
   */
  prompt: string;
}
