
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
  appNames: /^[a-z0-9_.-]+$/,
  appNamesWithDot: /^[a-z0-9_.-]+$/,
  appNameWithUppercase: /^[a-zA-Z0-9_]+$/,
  appNameWithUppercaseHyphen: /^[a-zA-Z0-9_-]+$/,
  domain: /(^https?:\/\/)([\w\-])+\.{1}([a-zA-Z]{2,63})([\/\w-]*)*\/?\??([^#\n\r]*)?#?([^\n\r]*)/,
  backend: /^https?:\/\/([\w\-.])+(:[0-9]*)?(\.\w+)?$/,
  email: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
  password: /^.{12,}$/
};
