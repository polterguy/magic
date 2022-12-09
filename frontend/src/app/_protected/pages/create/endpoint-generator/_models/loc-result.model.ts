
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

// Application specific imports
import { Response } from '../../../../../models/response.model';

/**
 * Model returned from backend when code is generated.
 */
export class LocResult extends Response {

  /**
   * Lines of code generated during invocation to backend.
   */
  loc: number;
}
