import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableNameDialogComponent } from './table-name-dialog.component';

describe('TableNameDialogComponent', () => {
  let component: TableNameDialogComponent;
  let fixture: ComponentFixture<TableNameDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TableNameDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableNameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
