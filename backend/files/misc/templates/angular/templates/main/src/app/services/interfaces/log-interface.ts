/**
 * Log interface, allowing you to create server side log entries.
 */
export interface ILog {

  /**
   * Logs a debug entry.
   * 
   * @param content What to log
   */
  debug(content: string) : void;

  /**
   * Logs an info entry.
   * 
   * @param content What to log
   */
  info(content: string) : void;

  /**
   * Logs an error entry.
   * 
   * @param content What to log
   */
  error(content: string) : void;

  /**
   * Logs a fatal entry.
   * 
   * @param content What to log
   */
  fatal(content: string) : void;
}
