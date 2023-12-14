
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { NgModule } from '@angular/core';

import { ScrollingModule } from '@angular/cdk/scrolling';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatPaginatorModule } from '@angular/material/paginator';
import { A11yModule } from '@angular/cdk/a11y';
import { MatSliderModule } from '@angular/material/slider';
import { MatTreeModule } from '@angular/material/tree';

@NgModule({
  exports: [
    MatIconModule,
    MatProgressBarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatTabsModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatDividerModule,
    MatBadgeModule,
    MatDialogModule,
    MatExpansionModule,
    MatTooltipModule,
    MatTableModule,
    MatStepperModule,
    MatMenuModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatBottomSheetModule,
    MatToolbarModule,
    MatSortModule,
    MatAutocompleteModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatRadioModule,
    MatPaginatorModule,
    A11yModule,
    MatSliderModule,
    ScrollingModule,
    MatTreeModule
  ],
  imports: [
    MatIconModule,
    MatProgressBarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatTabsModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatDividerModule,
    MatBadgeModule,
    MatDialogModule,
    MatExpansionModule,
    MatTooltipModule,
    MatTableModule,
    MatStepperModule,
    MatMenuModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatBottomSheetModule,
    MatToolbarModule,
    MatSortModule,
    MatAutocompleteModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatRadioModule,
    MatPaginatorModule,
    A11yModule,
    MatSliderModule,
    ScrollingModule,
    MatTreeModule
  ],
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } }
  ]
})
export class MaterialModule { }
