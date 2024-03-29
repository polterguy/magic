
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatbotWizardRoutingModule } from './chatbot-wizard.routing.module';
import { CommonComponentsModule } from 'src/app/components/protected/common/common-components.module';
import { MaterialModule } from 'src/app/modules/material.module';
import { ChatbotWizardComponent } from '../chatbot-wizard.component';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/modules/shared.module';

@NgModule({
  declarations: [
    ChatbotWizardComponent,
  ],
  imports: [
    CommonModule,
    ChatbotWizardRoutingModule,
    CommonComponentsModule,
    MaterialModule,
    FormsModule,
    SharedModule
  ]
})
export class ChatbotWizardModule { }
