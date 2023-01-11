
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule } from '@angular/forms';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { MachineLearningTrainingComponent } from '../machine-learning-training/machine-learning-training.component';
import { MachineLearningTrainingRoutingModule } from './machine-learning.routing.module';
import { MachineLearningDetailsComponent } from '../components/machine-learning-details/machine-learning-details.component';
import { CmModule } from 'src/app/codemirror/_module/cm.module';
import { MachineLearningTypeComponent } from '../components/machine-learning-type/machine-learning-type.component';

@NgModule({
  declarations: [
    MachineLearningTrainingComponent,
    MachineLearningDetailsComponent,
    MachineLearningTypeComponent,
  ],
  imports: [
    CommonModule,
    MachineLearningTrainingRoutingModule,
    MaterialModule,
    CmModule,
    FormsModule,
    ComponentsModule,
  ]
})
export class MachineLearningTrainingModule { }
