/*
 * This module imports and re-exports all Angular Material modules for convenience,
 * so only 1 module import is needed in your feature modules.
 * See https://material.angular.io/guide/getting-started#step-3-import-the-component-modules.
 *
 * To optimize your production builds, you should only import the components used in your app.
 */

import { NgModule } from '@angular/core';
import {
  MatCommonModule,
  MatLineModule,
  MatNativeDateModule,
  MatOptionModule,
  MatPseudoCheckboxModule,
  MatRippleModule,
} from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTabsModule } from '@angular/material/tabs';

@NgModule({
  exports: [
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatCommonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatLineModule,
    MatMenuModule,
    MatNativeDateModule,
    MatOptionModule,
    MatPaginatorModule,
    MatPseudoCheckboxModule,
    MatRippleModule,
    MatSelectModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatTableModule,
    MatToolbarModule,
    MatTooltipModule,
    MatDividerModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatAutocompleteModule,
    MatTabsModule
  ],
})
export class MaterialModule {}
