import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssumptionsComponent } from './assumptions.component';

describe('AssumptionsComponent', () => {
  let component: AssumptionsComponent;
  let fixture: ComponentFixture<AssumptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssumptionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssumptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
