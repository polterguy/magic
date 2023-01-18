
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule } from '@angular/forms';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { MachineLearningSnippetsComponent } from '../machine-learning-snippets/machine-learning-snippets.component';
import { MachineLearningTrainingRoutingModule } from './machine-learning.routing.module';
import { MachineLearningEditSnippetComponent } from '../components/machine-learning-edit-snippet/machine-learning-edit-snippet.component';
import { CmModule } from 'src/app/codemirror/_module/cm.module';
import { MachineLearningEditTypeComponent } from '../components/machine-learning-edit-type/machine-learning-edit-type.component';
import { MachineLearningComponent } from '../machine-learning.component';
import { MachineLearningTypesComponent } from '../machine-learning-types/machine-learning-types.component';
import { MachineLearningRequestsComponent } from '../machine-learning-requests/machine-learning-requests.component';
import { MachineLearningEditRequestComponent } from '../components/machine-learning-edit-request/machine-learning-edit-request.component';
import { MachineLearningTestComponent } from '../components/machine-learning-test/machine-learning-test.component';
import { SharedModule } from 'src/app/shared.module';
import { MachineLearningTrainComponent } from '../components/machine-learning-train/machine-learning-train.component';
import { MachineLearningImportComponent } from '../components/machine-learning-import/machine-learning-import.component';

@NgModule({
  declarations: [
    MachineLearningSnippetsComponent,
    MachineLearningEditSnippetComponent,
    MachineLearningEditTypeComponent,
    MachineLearningComponent,
    MachineLearningTypesComponent,
    MachineLearningRequestsComponent,
    MachineLearningEditRequestComponent,
    MachineLearningTestComponent,
    MachineLearningTrainComponent,
    MachineLearningImportComponent,
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
