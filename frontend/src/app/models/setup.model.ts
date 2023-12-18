
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

export interface SetupModel {

  /**
   * Password to use for root user.
   */
  password: string | null,

  /**
   * Full name of person configuring Magic.
   */
  name: string | null,

  /**
   * Email of person configuring Magic.
   */
  email: string | null,
}
