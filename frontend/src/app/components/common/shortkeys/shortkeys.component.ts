
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

interface Keys {
  name: string,
  key: string
}

/**
 * Dialog for showing user keyboard shortcuts for CodeMirror editors.
 */
@Component({
  selector: 'app-shortkeys',
  templateUrl: './shortkeys.component.html'
})
export class ShortkeysComponent implements OnInit {

  public shortkeys: Keys[] = fixKeys;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { type: string[] }) { }

  ngOnInit() {

    this.prepareData();
  }

  /*
   * Private helper methods.
   */

  private prepareData() {

    if (this.data.type.indexOf('save') > -1) {
      this.shortkeys = [
        ...this.shortkeys,
        {
          name: 'Save',
          key: 'Alt + S'
        }
      ];
    }
    if (this.data.type.indexOf('find') > -1) {
      this.shortkeys = [
        ...this.shortkeys,
        {
          name: 'Find',
          key: 'Alt + F'
        }
      ];
    }
    if (this.data.type.indexOf('execute') > -1) {
      this.shortkeys = [
        ...this.shortkeys,
        {
          name: 'Execute',
          key: 'F5'
        }
      ];
    }
    if (this.data.type.indexOf('prompt') > -1) {
      this.shortkeys = [
        ...this.shortkeys,
        {
          name: 'AI based help',
          key: 'F1'
        }
      ];
    }
    if (this.data.type.indexOf('insertSnippet') > -1) {
      this.shortkeys = [
        ...this.shortkeys,
        {
          name: 'Load snippet',
          key: 'ALT + V'
        }
      ];
    }
    if (this.data.type.indexOf('full') > -1) {
      this.shortkeys = [
        ...this.shortkeys,
        ...fullkeys
      ];
    }
  }
}

const fixKeys: Keys[] = [
  {
    name: 'Toggle fullscreen',
    key: 'Alt + M'
  },
  {
    name: 'Search',
    key: 'Ctrl + F / Cmd + F'
  },
  {
    name: 'Find next',
    key: 'Ctrl + G / Cmd + G'
  },
  {
    name: 'Find previous',
    key: 'Shift + Ctrl + G / Shift + Cmd + G'
  },
  {
    name: 'Replace',
    key: 'Shift + Ctrl + F / Cmd + Option + F'
  },
  {
    name: 'Replace all',
    key: 'Shift + Ctrl + R / Shift + Cmd + Option + F'
  },
  {
    name: 'Jump to line',
    key: 'Alt + G'
  }
];

const fullkeys: Keys[] = [

  {
    name: 'Save File',
    key: 'Alt + S'
  },
  {
    name: 'Execute File or Endpoint',
    key: 'F5'
  },
  {
    name: 'Preview File',
    key: 'ALT + P'
  },
  {
    name: 'Insert snippet',
    key: 'ALT + V'
  },
  {
    name: 'Close File',
    key: 'Alt + C'
  },
  {
    name: 'Rename File',
    key: 'Alt + R'
  },
  {
    name: 'Rename Folder',
    key: 'Alt + L'
  },
  {
    name: 'Delete File',
    key: 'Alt + D'
  },
  {
    name: 'Delete Folder',
    key: 'Alt + X'
  },
  {
    name: 'New file',
    key: 'Alt + A'
  },
  {
    name: 'New folder',
    key: 'Alt + B'
  },
  {
    name: 'Show autocomplete',
    key: 'CTRL + SPACE'
  },
  {
    name: 'Indent',
    key: 'TAB'
  },
  {
    name: 'Deindent',
    key: 'SHIFT + TAB'
  }
];
