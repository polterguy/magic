
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

// Angular specific imports.
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

// CodeMirror mode imports.
import 'codemirror/mode/sql/sql';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/css/css';
import 'codemirror/mode/sass/sass';
import 'codemirror/mode/yaml/yaml';
import 'codemirror/mode/ruby/ruby';
import 'codemirror/mode/shell/shell';
import 'codemirror/mode/python/python';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/search';
import 'codemirror/addon/search/jump-to-line';

// CodeMirror addons.
import 'codemirror/addon/display/fullscreen';
import 'codemirror/addon/selection/active-line';

// Application specific imports.
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { RecaptchaComponent } from 'ng-recaptcha';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule).then(() => {
  if ('serviceWorker' in navigator && environment.production) {
    navigator.serviceWorker.register('ngsw-worker.js');
  }
}).catch(err => console.log(err));

RecaptchaComponent.prototype.ngOnDestroy = function () {
  if (this.subscription) {
    this.subscription.unsubscribe();
  }
}
