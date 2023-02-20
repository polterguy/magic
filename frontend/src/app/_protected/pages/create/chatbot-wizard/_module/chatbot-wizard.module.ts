
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatbotWizardRoutingModule } from './chatbot-wizard.routing.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { MaterialModule } from 'src/app/material.module';
import { ChatbotWizardComponent } from '../chatbot-wizard.component';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared.module';

@NgModule({
  declarations: [
    ChatbotWizardComponent,
  ],
  imports: [
    CommonModule,
    ChatbotWizardRoutingModule,
    ComponentsModule,
    MaterialModule,
    FormsModule,
    SharedModule
  ]
})
export class ChatbotWizardModule { }
