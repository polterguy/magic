
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// This little trick makes pipeline transformations slightly simpler in Azure at least.
import prod_environment from "./environment.prod.json";

export const environment = {
  production: true,
  defaultBackends: [
    {
      url: prod_environment.url,
      username: 'root',
      password: 'root',
    },
  ],
  bazarUrl: 'https://ainiro.io',
  hyperLambdaGeneratorUrl: 'https://ainiro.io'
};
