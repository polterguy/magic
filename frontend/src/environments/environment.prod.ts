
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// This little trick makes pipeline transformations slightly simpler in Azure at least.
import prod_url from "./environment.prod.json";

export const environment = {
  production: true,
  defaultBackends: [
    {
      url: prod_url.url,
      username: 'root',
      password: 'root',
     },
  ],
};
