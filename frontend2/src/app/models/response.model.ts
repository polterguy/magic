
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

/**
 * Generic model for endpoints not returning anything but whether
 * or not the operation was a success or not.
 * 
 * Notice, if operation was a asuccess the result field will normally
 * have a value of 'success'.
 */
export class Response {
  result: string;
}
  