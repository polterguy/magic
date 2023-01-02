
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
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
  bazarUrl: 'https://api.aista.com'
};
