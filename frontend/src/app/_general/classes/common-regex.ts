
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

/**
 * Collection of reusable regular expressions.
 */
export const CommonRegEx: { [key: string]: RegExp } = {
  phone: /^[0-9 ]*$/,
  name: /^[a-z0-9]{2,20}$/,
  subject: /^.{4,1000}$/,
  appNames: /^[a-z0-9_-]+$/,
  appNameWithUppercase: /^[a-zA-Z0-9_]+$/,
};
