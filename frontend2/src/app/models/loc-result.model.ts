
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Application specific imports
import { Response } from './response.model';

/**
 * Model returned from backend when code is generated.
 */
export class LocResult extends Response {
  loc: number;
}
  