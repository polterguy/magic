
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule } from '@angular/forms';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { MachineLearningTrainingDataComponent } from '../machine-learning-training-data/machine-learning-training-data.component';
import { MachineLearningTrainingRoutingModule } from './machine-learning.routing.module';
import { MachineLearningEditTrainingSnippetComponent } from '../components/machine-learning-edit-training-snippet/machine-learning-edit-training-snippet.component';
import { CmModule } from 'src/app/codemirror/_module/cm.module';
import { MachineLearningEditTypeComponent } from '../components/machine-learning-edit-model/machine-learning-edit-model.component';
import { MachineLearningComponent } from '../machine-learning.component';
import { MachineLearningModelsComponent } from '../machine-learning-models/machine-learning-models.component';
import { MachineLearningRequestsComponent } from '../machine-learning-history/machine-learning-history.component';
import { MachineLearningEditCacheComponent } from '../components/machine-learning-edit-cache/machine-learning-edit-cache.component';
import { MachineLearningTestComponent } from '../components/machine-learning-test/machine-learning-test.component';
import { SharedModule } from 'src/app/shared.module';
import { MachineLearningTrainComponent } from '../components/machine-learning-train/machine-learning-train.component';
import { MachineLearningImportComponent } from '../components/machine-learning-import/machine-learning-import.component';
import { MachineLearningEmbedUiComponent } from '../components/machine-learning-embed-ui/machine-learning-embed-ui.component';
import { MachineLearningSpiceComponent } from '../components/machine-learning-spice/machine-learning-spice.component';
import { MachineLearningQuestionnairesComponent } from '../machine-learning-questionnaires/machine-learning-questionnaires.component';

@NgModule({
  declarations: [
    MachineLearningTrainingDataComponent,
    MachineLearningEditTrainingSnippetComponent,
    MachineLearningEditTypeComponent,
    MachineLearningComponent,
    MachineLearningModelsComponent,
    MachineLearningRequestsComponent,
    MachineLearningEditCacheComponent,
    MachineLearningTestComponent,
    MachineLearningTrainComponent,
    MachineLearningImportComponent,
    MachineLearningEmbedUiComponent,
    MachineLearningSpiceComponent,
    MachineLearningQuestionnairesComponent,
  ],
  imports: [
    CommonModule,
    MachineLearningTrainingRoutingModule,
    MaterialModule,
    CmModule,
    FormsModule,
    ComponentsModule,
    SharedModule,
  ]
})
export class MachineLearningTrainingModule { }
