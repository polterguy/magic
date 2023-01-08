
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MachineLearningTrainingService } from 'src/app/_general/services/machine-learning-training.service';

/**
 * Helper component to administrate training data for OpenAI integration
 * and Machine Learning integration.
 */
@Component({
  selector: 'app-machine-learning',
  templateUrl: './machine-learning.component.html',
  styleUrls: ['./machine-learning.component.scss']
})
export class MachineLearningTrainingComponent implements OnInit {

  isLoading: boolean = false;
  dataSource: any[] = [];
  count: number = 0;
  index: number = 0;
  displayedColumns: string[] = [
    'type',
    'prompt',
    'pushed',
    'action',
  ];

  constructor(private machineLearningTrainingService: MachineLearningTrainingService) { }

  ngOnInit() {
    this.getItems();
  }

  showDetails(el: any) {
    console.log(el);
  }

  page(event: PageEvent) {
    console.log(event);
  }

  filterList(event: any) {
    console.log(event);
  }

  /*
   * Private helper methods.
   */

  getItems() {
    this.machineLearningTrainingService.list().subscribe({
      next: (result: any[]) => {
        this.dataSource = result || [];
      },
    });
  }
}
