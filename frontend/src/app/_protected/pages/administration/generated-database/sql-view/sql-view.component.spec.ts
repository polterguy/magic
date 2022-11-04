import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SqlViewComponent } from './sql-view.component';

describe('SqlViewComponent', () => {
  let component: SqlViewComponent;
  let fixture: ComponentFixture<SqlViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SqlViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SqlViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
