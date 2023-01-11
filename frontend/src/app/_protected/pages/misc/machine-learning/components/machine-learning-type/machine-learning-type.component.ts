
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';

/**
 * Helper component to create or edit existing Machine Learning type.
 */
@Component({
  selector: 'app-machine-learning-type',
  templateUrl: './machine-learning-type.component.html',
  styleUrls: ['./machine-learning-type.component.scss']
})
export class MachineLearningTypeComponent implements OnInit {

  type: string = null;
  temperature: string = null;
  max_tokens: string = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<MachineLearningTypeComponent>,) { }

  ngOnInit() {
    this.type = this.data?.type;
    this.max_tokens = this.data?.max_tokens ?? 2000;
    this.temperature = this.data?.temperature ?? 0.5;
  }

  save() {

    const data: any = {
      type: this.type,
      max_tokens: this.max_tokens,
      temperature: this.temperature,
    };
    this.dialogRef.close(data);
  }
}
