
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

/**
 * Collection of reusable error messages
 */
export const CommonErrorMessages: { [key: string]: string } = {

  name: 'Name must be minimum 2 characters long',
  backendname: 'Alphanumeric characters between 2 to 20 (no space).',
  username: 'Alphanumeric between 2 and 20 characters (no space)',
  email: 'Email must be a valid email address',
  confirmEmail: 'Email addresses must match',
  confirmPassword: 'Passwords must match',
  currentPassword: 'Your password is incorrect',
  cloudletName: 'Minimum of 5 characters, only lowercase and numbers',
  phone: 'e.g. 1111111111',
  subject: '2 to 30 letters, without special characters',
  message: 'Message cannot be less than 3 characters',
  appNames: 'Only lowercase alphanumeric characters, dot (.), - or _ please',
  appNamesWithUppercaseDot: 'Only alphanumeric characters, dot (.), - or _ please',
  appNamesWithDot: 'Only lowercase alphanumeric characters, and - or _ please',
  appNameWithUppercase: 'Accepts alphanumeric characters and _',
  appNameWithUppercaseHyphen: 'Accepts alphanumeric characters, - and _',
  domain: 'Domain is not valid',
  backend: 'Backend URL must contain http://',
  password: 'Minimum 12 characters'
};
