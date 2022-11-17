import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

interface Keys {
  name: string,
  key: string
}

@Component({
  selector: 'app-shortkeys',
  templateUrl: './shortkeys.component.html',
  styleUrls: ['./shortkeys.component.scss']
})
export class ShortkeysComponent implements OnInit {

  public shortkeys: Keys[] = shortkeys;

  constructor(@Inject(MAT_DIALOG_DATA) public data) { }

  ngOnInit(): void {
  }

}

const shortkeys: Keys[] = [
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
  },
  {
    name: 'Save File',
    key: 'Alt + S'
  },
  {
    name: 'Execute File',
    key: 'F5'
  },
  // {
  //   name: 'Preview File',
  //   key: 'ALT + P'
  // },
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
    name: 'Execute macro',
    key: 'Alt + O'
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
]
