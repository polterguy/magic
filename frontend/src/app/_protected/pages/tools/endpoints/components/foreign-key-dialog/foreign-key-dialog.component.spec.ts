import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForeignKeyDialogComponent } from './foreign-key-dialog.component';

describe('ForeignKeyDialogComponent', () => {
  let component: ForeignKeyDialogComponent;
  let fixture: ComponentFixture<ForeignKeyDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForeignKeyDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForeignKeyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
