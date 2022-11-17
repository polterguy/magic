import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodemirrorSqlComponent } from './codemirror-sql.component';

describe('CodemirrorSqlComponent', () => {
  let component: CodemirrorSqlComponent;
  let fixture: ComponentFixture<CodemirrorSqlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CodemirrorSqlComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodemirrorSqlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
