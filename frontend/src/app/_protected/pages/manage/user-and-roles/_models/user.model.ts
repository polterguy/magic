
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

/**
 * User model for retrieving users from your backend.
 */
export class User {

  /**
   * Username of user.
   */
  username: string;

  /**
   * Password of user.
   */
  password?: string;

  /**
   * Whether or not user has been locked out from site or not.
   */
  locked?: boolean;

  /**
   * Roles user belongs to.
   */
  roles?: string[];

  /**
   * Extra information associated with user.
   */
  extra?: User_Extra[] = [];
}

/**
 * User extra model for retrieving extra info from the users from your backend.
 */
export class User_Extra {
  /**
   * Type of the given field
   */
  type: string;

  /**
   * Email address of user, to be username
   */
  user: string;

  /**
   * The value of the given type
   */
  value: string;

  /**
   * Only for temporary use when adding new field
   */
  new?: boolean
}