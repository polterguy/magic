
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

export interface User {
  username: string,
  password?: string,
  role?: string,
  recaptcha_response?: string
}
