
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
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
  bazarUrl: 'https://magic-api.aista.com'
};
