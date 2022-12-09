
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { FileNode } from './_models/file-node.model';

@Component({
  selector: 'app-ide',
  templateUrl: './ide.component.html',
  styleUrls: ['./ide.component.scss']
})
export class IdeComponent implements OnInit {

  /**
   * Currently selected file.
   */
  public currentFileData: FileNode;

  public searchKey: Observable<string>;

  public type: Observable<string>;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.type = data.type;
    });
  }

  public showEditor(event: { currentFileData: any }) {
    this.currentFileData = event.currentFileData;
  }

  public filterList(event: any) {
    this.searchKey = event;
  }

}
