import { Injectable } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { Logger } from '@core/logger.service';
import enUS from '../../translations/en-US.json';
import no from '../../translations/no.json';
import es from '../../translations/es.json';
import fr from '../../translations/fr.json';
import it from '../../translations/it.json';
import de from '../../translations/de.json';
import pt from '../../translations/pt.json';
import hi from '../../translations/hi.json';
import ar from '../../translations/ar.json';
import iw from '../../translations/iw.json';
import zh from '../../translations/zh.json';
import el from '../../translations/el.json';

const log = new Logger('I18nService');
const languageKey = 'language';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  defaultLanguage!: string;
  supportedLanguages!: string[];

  private langChangeSubscription!: Subscription;

  constructor(private translateService: TranslateService) {
    // Embed languages to avoid extra HTTP requests
    translateService.setTranslation('en-US', enUS);
    translateService.setTranslation('no', no);
    translateService.setTranslation('es', es);
    translateService.setTranslation('fr', fr);
    translateService.setTranslation('it', it);
    translateService.setTranslation('de', de);
    translateService.setTranslation('pt', pt);
    translateService.setTranslation('hi', hi);
    translateService.setTranslation('ar', ar);
    translateService.setTranslation('iw', iw);
    translateService.setTranslation('zh', zh);
    translateService.setTranslation('el', el);
  }

  /**
   * Initializes i18n for the application.
   * Loads language from local storage if present, or sets default language.
   * @param defaultLanguage The default language to use.
   * @param supportedLanguages The list of supported languages.
   */
  init(defaultLanguage: string, supportedLanguages: string[]) {
    this.defaultLanguage = defaultLanguage;
    this.supportedLanguages = supportedLanguages;
    this.language = '';

    // Warning: this subscription will always be alive for the app's lifetime
    this.langChangeSubscription = this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
      localStorage.setItem(languageKey, event.lang);
    });
  }

  /**
   * Cleans up language change subscription.
   */
  destroy() {
    if (this.langChangeSubscription) {
      this.langChangeSubscription.unsubscribe();
    }
  }

  /**
   * Sets the current language.
   * Note: The current language is saved to the local storage.
   * If no parameter is specified, the language is loaded from local storage (if present).
   * @param language The IETF language code to set.
   */
  set language(language: string) {
    language = language || localStorage.getItem(languageKey) || this.translateService.getBrowserCultureLang();
    let isSupportedLanguage = this.supportedLanguages.includes(language);

    // If no exact match is found, search without the region
    if (language && !isSupportedLanguage) {
      language = language.split('-')[0];
      language = this.supportedLanguages.find((supportedLanguage) => supportedLanguage.startsWith(language)) || '';
      isSupportedLanguage = Boolean(language);
    }

    // Fallback if language is not supported
    if (!isSupportedLanguage) {
      language = this.defaultLanguage;
    }

    log.debug(`Language set to ${language}`);
    this.translateService.use(language);
  }

  /**
   * Gets the current language.
   * @return The current language code.
   */
  get language(): string {
    return this.translateService.currentLang;
  }
}
