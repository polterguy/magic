
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { Backend } from 'src/app/models/backend.model';

export const environment = {
  production: false,
  defaultBackends: [
    { url: 'http://localhost:55247' },
  ],
};
