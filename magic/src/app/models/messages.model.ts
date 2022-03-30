
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

/**
 * Common messages wrapper class. Contains static fields
 * for the most common messages system will publish,
 * and/or handle somehow.
 */
export class Messages {

  /**
   * Message will be published when a component needs to be dynamically injected somewhere.
   */
  static readonly INJECT_COMPONENT = 'app.ui.inject-component';

  /**
   * Message will be published when dynamically injected component wrapper needs to be cleared
   * for any dynamically injected components.
   */
  static readonly CLEAR_COMPONENTS = 'app.ui.clear-dynamic-components';
}
