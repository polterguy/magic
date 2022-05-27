import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SqlWarningComponent } from './sql-warning.component';

describe('SqlWarningComponent', () => {
  let component: SqlWarningComponent;
  let fixture: ComponentFixture<SqlWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SqlWarningComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SqlWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
