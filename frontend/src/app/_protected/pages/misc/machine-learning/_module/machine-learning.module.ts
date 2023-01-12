
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule } from '@angular/forms';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { MachineLearningTrainingSnippetsComponent } from '../components/machine-learning-training-snippets/machine-learning-training-snippets.component';
import { MachineLearningTrainingRoutingModule } from './machine-learning.routing.module';
import { MachineLearningEditSnippetComponent } from '../components/machine-learning-edit-snippet/machine-learning-edit-snippet.component';
import { CmModule } from 'src/app/codemirror/_module/cm.module';
import { MachineLearningEditModelComponent } from '../components/machine-learning-edit-model/machine-learning-edit-model.component';
import { MachineLearningComponent } from '../machine-learning.component';
import { MachineLearningModelsComponent } from '../components/machine-learning-models/machine-learning-models.component';

@NgModule({
  declarations: [
    MachineLearningTrainingSnippetsComponent,
    MachineLearningEditSnippetComponent,
    MachineLearningEditModelComponent,
    MachineLearningComponent,
    MachineLearningModelsComponent,
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
