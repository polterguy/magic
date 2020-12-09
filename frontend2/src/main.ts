
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular specific imports.
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

// CodeMirror imports, first modes
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/markdown/markdown';

// Then addons.
import 'codemirror/addon/display/fullscreen';

// Application specific imports.
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
