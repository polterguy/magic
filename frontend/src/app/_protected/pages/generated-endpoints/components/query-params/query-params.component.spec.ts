import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QueryParamsComponent } from './query-params.component';

describe('QueryParamsComponent', () => {
  let component: QueryParamsComponent;
  let fixture: ComponentFixture<QueryParamsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QueryParamsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QueryParamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
