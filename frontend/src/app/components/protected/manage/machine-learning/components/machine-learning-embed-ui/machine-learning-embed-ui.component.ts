
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { BackendService } from 'src/app/services/backend.service';
import { GeneralService } from 'src/app/services/general.service';
import { OpenAIService } from 'src/app/services/openai.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Helper component to create HTML required to embed chatbot in HTML.
 */
@Component({
  selector: 'app-machine-learning-embed-ui',
  templateUrl: './machine-learning-embed-ui.component.html',
  styleUrls:['./machine-learning-embed-ui.component.scss']
})
export class MachineLearningEmbedUiComponent implements OnInit {

  theme: string = 'scandinavian-navy';
  themes: string[] = [];
  modernTheme: string = 'modern-square';
  modernThemes: string[] = [];
  themeSearch: string = 'default';
  themesSearch: string[] = [];
  type: string = null;
  header: string = 'Ask about our services or products';
  popup: string = '';
  buttonTxt: string = 'AI Chatbot';
  textboxPlaceholder = 'Ask me anything ...';
  search: boolean = false;
  chat: boolean = true;
  markdown: boolean = true;
  speech: boolean = false;
  rtl: boolean = false;
  clear_button: boolean = false;
  follow_up: boolean = true;
  copy_button: boolean = false;
  new_tab: boolean = false;
  code: boolean = false;
  has_button: boolean = true;
  stream: boolean = true;
  placeholder: string = 'Search ...';
  buttonTxtSearch: string = '';
  maxSearch: number = 5;
  currentTabIndex: number = 0;
  landing_page: boolean = false;
  startColor: string = '#7892e5';
  endColor: string = '#142660';
  foreColor: string = '#fefefe';
  linkColor: string = '#fe8464';
  positioning: string = 'right';
  animations: string = 'none';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private clipboard: Clipboard,
    private backendService: BackendService,
    private openAiService: OpenAIService,
    private dialogRef: MatDialogRef<MachineLearningEmbedUiComponent>,
    private generalService: GeneralService) {
      this.type = this.data.type;
      this.landing_page = this.data.landing_page;
    }

  ngOnInit() {

    if (this.data.search === true) {
      this.search = true;
    }

    // Retrieving all themes from the backend.
    this.openAiService.themes().subscribe({
      next: (themes: string[]) => {

        this.themes = themes.filter(x => !x.startsWith('modern') && !x.startsWith('common'));
        this.modernThemes = themes.filter(x => x.startsWith('modern'));
      },
      error: () => {

        this.generalService.showFeedback('Something went wrong as we tried to retrieve themes', 'errorMessage');
        this.generalService.hideLoading();
      }
    });

    // Retrieving all themes from the backend.
    this.openAiService.themesSearch().subscribe({
      next: (themes: string[]) => {

        this.themesSearch = themes;
      },
      error: () => {

        this.generalService.showFeedback('Something went wrong as we tried to retrieve themes', 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  selectedIndexChange(tabIndex: number) {

    this.currentTabIndex = tabIndex;
  }

  getLandingPage() {

    return this.backendService.active.url + '/' + this.type;
  }

  embed() {

    switch (this.currentTabIndex) {

      case 0:
        this.embedModernChatbot(true);
        break;

      case 1:
        this.embedChatbot(true);
        break;

      case 2:
        this.embedSearch(true);
        break;
    }
  }

  embedUrl() {

    switch (this.currentTabIndex) {

      case 0:
        this.embedModernChatbot(false);
        break;

      case 1:
        this.embedChatbot(false);
        break;

      case 2:
        this.embedSearch(false);
        break;
    }
  }

  embedModernChatbot(html: boolean) {

    this.clipboard.copy(this.getModernChatbotEmbed(html));
    this.generalService.showFeedback('HTML to include chatbot can be found on your clipboard', 'successMessage');
    if (this.data.noClose !== true) {
      this.dialogRef.close();
    }
  }

  embedChatbot(html: boolean) {

    if (this.search === false && this.chat === false) {

      this.generalService.showFeedback('You have to choose at least one of chat or search', 'errorMessage');
      return;
    }

    this.clipboard.copy(this.getChatbotEmbed(html));
    this.generalService.showFeedback('HTML to include chatbot can be found on your clipboard', 'successMessage');
    if (this.data.noClose !== true) {
      this.dialogRef.close();
    }
  }

  embedSearch(html: boolean) {

    this.clipboard.copy(this.getSearchEmbed(html));
    this.generalService.showFeedback('HTML to include AI Search can be found on your clipboard', 'successMessage');
    if (this.data.noClose !== true) {
      this.dialogRef.close();
    }
  }

  /*
   * Private helper methods.
   */

  private getModernChatbotEmbed(html: boolean) {

    let url = `${this.backendService.active.url}/magic/system/openai/include-chatbot.js?rtl=${this.rtl ? 'true' : 'false'}&clear_button=${this.clear_button ? 'true' : 'false'}&follow_up=${this.follow_up ? 'true' : 'false'}&copyButton=${this.copy_button ? 'true' : 'false'}&new_tab=${this.new_tab ? 'true' : 'false'}&code=${this.code ? 'true' : 'false'}&references=${this.search ? 'true' : 'false'}&position=${this.positioning}&type=${encodeURIComponent(this.type)}&header=${encodeURIComponent(this.header)}&popup=${encodeURIComponent(this.popup)}&button=${encodeURIComponent(this.buttonTxt)}&placeholder=${encodeURIComponent(this.textboxPlaceholder)}&color=${encodeURIComponent(this.foreColor)}&start=${encodeURIComponent(this.startColor)}&end=${encodeURIComponent(this.endColor)}&link=${encodeURIComponent(this.linkColor)}&theme=${encodeURIComponent(this.modernTheme)}`;
    if (this.animations && this.animations !== 'none') {
      url += '&animation=' + this.animations;
    }

    if (html) {
      return `<script src="${url}" defer></script>`;
    }
    return url;
  }

  private getChatbotEmbed(html: boolean) {

    if (html) {
      return `<script src="${this.backendService.active.url}/magic/system/openai/include-javascript.js?markdown=${this.markdown ? 'true' : 'false'}&speech=${this.speech ? 'true' : 'false'}&rtl=${this.rtl ? 'true' : 'false'}&submit_button=${this.has_button ? 'true' : 'false'}&stream=${this.stream ? 'true' : 'false'}&search=${this.search ? 'true' : 'false'}&chat=${this.chat ? 'true' : 'false'}&css=${encodeURIComponent(this.theme)}&file=default&type=${encodeURIComponent(this.type)}&header=${encodeURIComponent(this.header)}&button=${encodeURIComponent(this.buttonTxt)}" defer></script>`;
    }
    return `${this.backendService.active.url}/magic/system/openai/include-javascript?markdown=${this.markdown ? 'true' : 'false'}&speech=${this.speech ? 'true' : 'false'}&rtl=${this.rtl ? 'true' : 'false'}&submit_button=${this.has_button ? 'true' : 'false'}&stream=${this.stream ? 'true' : 'false'}&search=${this.search ? 'true' : 'false'}&chat=${this.chat ? 'true' : 'false'}&css=${encodeURIComponent(this.theme)}&file=default&type=${encodeURIComponent(this.type)}&header=${encodeURIComponent(this.header)}&button=${encodeURIComponent(this.buttonTxt)}`;
  }

  private getSearchEmbed(html: boolean) {

    if (html) {
      return `<script src="${this.backendService.active.url}/magic/system/openai/include-search?css=${encodeURIComponent(this.themeSearch)}&type=${encodeURIComponent(this.type)}&placeholder=${encodeURIComponent(this.placeholder)}&button=${encodeURIComponent(this.buttonTxtSearch)}&max=${this.maxSearch}" defer></script>`;
    }
    return `${this.backendService.active.url}/magic/system/openai/include-search?css=${encodeURIComponent(this.themeSearch)}&type=${encodeURIComponent(this.type)}&placeholder=${encodeURIComponent(this.placeholder)}&button=${encodeURIComponent(this.buttonTxtSearch)}&max=${this.maxSearch}`;
  }
}
