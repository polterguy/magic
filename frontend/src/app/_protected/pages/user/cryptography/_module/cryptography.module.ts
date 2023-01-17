
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CryptographyComponent } from '../cryptography.component';
import { CryptographyRoutingModule } from './cryptography.routing.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { MaterialModule } from 'src/app/material.module';
import { CryptographyPublicKeysComponent } from '../cryptography-public-keys/cryptography-public-keys.component';
import { SharedModule } from 'src/app/shared.module';
import { CryptographyReceiptsComponent } from '../cryptography-receipts/cryptography-receipts.component';
import { ServerKeyDetailsComponent } from '../components/server-key-details/server-key-details.component';
import { FormsModule } from '@angular/forms';
import { CmModule } from 'src/app/codemirror/_module/cm.module';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { NewServerKeyComponent } from '../components/new-server-key/new-server-key.component';

@NgModule({
  declarations: [
    CryptographyComponent,
    CryptographyPublicKeysComponent,
    CryptographyReceiptsComponent,
    ServerKeyDetailsComponent,
    NewServerKeyComponent
  ],
  imports: [
    CommonModule,
    CryptographyRoutingModule,
    ComponentsModule,
    MaterialModule,
    SharedModule,
    FormsModule,
    CmModule,
    CodemirrorModule
  ]
})
export class CryptographyModule { }
