
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';
import { GeneralService } from 'src/app/_general/services/general.service';

interface NewField {
  columnName?: string,
  columnType?: string,
  fieldType?: any, // only new column
  columnLength?: number, // only new column
  defaultValue?: string, // only new column
  nullable?: boolean,
  selectedTable?: any, // only for foreign key and will be used only in the UI
  foreignTable?: string, // only for foreign key
  foreignField?: string, // only for foreign key
  hasKey?: boolean,
  cascading?: boolean
}

interface ExpectedData {
  table: any,
  tables: any,
  databases: any,
  slectedDbType: string,
}

@Component({
  selector: 'app-add-field',
  templateUrl: './add-field.component.html',
  styleUrls: ['./add-field.component.scss']
})
export class AddFieldComponent implements OnInit {

  public formData: NewField = {
    columnName: '',
    fieldType: {},
    columnLength: undefined,
    defaultValue: '',
    nullable: true
  };

  fieldTypeList: any = fieldTypes;

  public CommonRegEx = CommonRegEx;
  public CommonErrorMessages = CommonErrorMessages;

  constructor(
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<AddFieldComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExpectedData) { }

  ngOnInit(): void {
  }

  public changeDefaultValue() {
    this.formData.defaultValue = '';

    const dbTypeForInt: boolean =
      this.data.slectedDbType === 'mysql' ||
      this.data.slectedDbType === 'sqlite';
    const dbTypeForDate: boolean =
      this.data.slectedDbType === 'mysql' ||
      this.data.slectedDbType === 'sqlite' ||
      this.data.slectedDbType === 'pgsql';


    if (this.formData.fieldType.size) {
      this.formData.columnLength = this.formData?.fieldType?.size?.defaultSize;
    } else if (this.formData.fieldType.defaultValue === 'date' && dbTypeForDate) {
      this.formData.defaultValue = 'current_timestamp';
    } else if (this.formData.fieldType.defaultValue === 'int' && dbTypeForInt) {
      this.formData.defaultValue = 'auto_increment';
    }

    this.formData.columnType = this.formData.fieldType.name;
  }

  public changeTable() {
    this.formData.foreignField = this.data.tables.find((item: any) => item.name === this.formData.selectedTable.name).columns[0].name;
    this.changeColumnName();
  }

  public changeColumnName() {
    this.formData.columnName = this.formData.foreignField;
  }

  public tabsCahnged(event: any) {
    let refreshedData: NewField = {
      nullable: false
    }
    if (event.index === 1) {
      refreshedData.cascading = false;
    }
    this.formData = refreshedData;
  }

  public create() {
    if (!this.validateName()) {
      this.generalService.showFeedback('Invalid name.', 'errorMessage');
      return;
    }
    if (this.formData.defaultValue !== '' && !this.validateDefaultValue()) {
      this.generalService.showFeedback('Invalid default value.', 'errorMessage');
      return;
    }

    let condition: boolean = false;

    if (this.formData?.cascading !== undefined) {
      condition = (this.formData.selectedTable && this.formData.foreignField && this.formData.columnName !== '');
    } else {
      if (this.formData.fieldType.size) {
        condition = (this.formData.columnName !== '' &&
          this.formData.fieldType &&
          this.formData.columnLength &&
          this.formData.columnLength >= this.formData.fieldType.size.min &&
          this.formData.columnLength <= this.formData.fieldType.size.max);
      } else {
        condition = (this.formData.columnName !== '' && this.formData.fieldType.name);
      }
    }

    if (condition) {
      this.dialogRef.close(this.formData);
    } else {
      this.generalService.showFeedback('Please fill the required fields.', 'errorMessage');
    }
  }

  private validateName() {
    return this.CommonRegEx.appNameWithUppercase.test(this.formData.columnName);
  }
  private validateDefaultValue() {
    return this.CommonRegEx.appNameWithUppercase.test(this.formData.defaultValue);
  }
}

const fieldTypes: any = {
  mysql: [
    {
      name: 'int',
      description: 'A whole number with no decimals that can be positive, negative, or zero.',
      defaultValue: 'number'
    },
    {
      name: 'varchar',
      description: 'A variable character field of indeterminate length, which can hold letters and numbers.',
      size: {
        min: 0,
        max: 16383,
        defaultSize: 100
      },
      defaultValue: 'string'
    },
    {
      name: 'mediumtext',
      description: 'Strings up to 16MB for longer text fields and / or images and files.',
      defaultValue: 'string'
    },
    {
      name: 'bool',
      description: 'A binary variable that can have one of two possible values, True and False.',
      defaultValue: 'bool'
    },
    {
      name: 'decimal',
      description: 'A whole number with decimals.',
    },
    {
      name: 'datetime',
      description: 'A variable that can hold both date and time.',
      defaultValue: 'date'
    },
  ],
  sqlite: [
    {
      name: 'integer',
      description: 'A whole number with no decimals that can be positive, negative, or zero.',
      defaultValue: 'int'
    },
    {
      name: 'numeric',
      description: 'A whole number with decimals.',
      defaultValue: 'decimal'
    },
    {
      name: 'text',
      description: 'A variable character field of indeterminate length, which can hold letters and numbers.',
      defaultValue: 'string'
    },
    {
      name: 'timestamp',
      description: 'A variable that can hold both date and time.',
      defaultValue: 'date'
    },
  ],
  pgsql: [
    {
      name: 'integer',
      description: 'A whole number with no decimals that can be positive, negative, or zero.',
      defaultValue: 'numeric'
    },
    {
      name: 'numeric',
      description: 'A whole number with decimals.',
      defaultValue: 'numeric'
    },
    {
      name: 'text',
      description: 'A variable character field of indeterminate length, which can hold letters and numbers.',
      defaultValue: 'string'
    },
    {
      name: 'boolean',
      description: 'A binary variable that can have one of two possible values, True and False.',
      defaultValue: 'bool'
    },
    {
      name: 'timestamptz',
      description: 'A variable that can hold both date and time.',
      defaultValue: 'date'
    }
  ],
  mssql: [
    {
      name: 'int',
      description: 'A whole number with no decimals that can be positive, negative, or zero.',
      defaultValue: 'integer'
    },
    {
      name: 'decimal',
      description: 'A whole number with decimals.',
      defaultValue: 'decimal'
    },
    {
      name: 'datetime2',
      description: 'A variable that can hold both date and time.',
      defaultValue: 'date'
    },
    {
      name: 'nvarchar',
      description: 'Strings with length of up to 2GB (4,000).',
      size: {
        min: 0,
        max: 4000
      },
      defaultValue: false
    },
    {
      name: 'ntext',
      description: 'Strings with length of up to 1,073,741,823 bytes for longer text fields and / or images and files.',
      defaultValue: 'string'
    }
  ]
}
