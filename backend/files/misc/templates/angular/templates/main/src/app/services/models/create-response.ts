/**
 * Common response class for invocations towards backend that creates
 * items. Notice, if the caller is responsible for supplying an explicit
 * id column for entity, the returned id from the backend will normally
 * be null.
 */
export class CreateResponse {

  /**
   * Id of new item. Might be null if caller is assumed to specify an explicit id
   * for the new entity.
   */
  id: any;
}
