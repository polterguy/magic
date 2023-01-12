
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';

/**
 * Helper component to manage Machine Learning training snippets, and types.
 */
@Component({
  selector: 'app-machine-learning',
  templateUrl: './machine-learning.component.html',
  styleUrls: ['./machine-learning.component.scss']
})
export class MachineLearningComponent implements OnInit {

  dataLoaded: boolean = false;

  constructor() { }

  ngOnInit() {
  }
}
