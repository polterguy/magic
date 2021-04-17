
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

/**
 * Common messages wrapper class. Contains static fields
 * for the most common messages system will publish,
 * and/or handle somehow.
 */
export class Messages {

  /**
   * Message will be published by the system when the user logs in.
   */
  static readonly USER_LOGGED_IN = 'app.user.logged-in';

  /**
   * Message will be published by the system when the user logs out.
   */
  static readonly USER_LOGGED_OUT = 'app.user.logged-out';

  /**
   * Message will be published by the system when the
   * navbar should be closed.
   */
  static readonly CLOSE_NAVBAR = 'app.navbar.close';

  /**
   * Message will be published by the system when the
   * navbar should be toggled.
   */
  static readonly TOGGLE_NAVBAR = 'app.navbar.toggle';

  /**
   * Message will be published when the setup state of your system changes.
   */
  static readonly SETUP_STATE_CHANGED = 'app.setup.status-changed';

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
