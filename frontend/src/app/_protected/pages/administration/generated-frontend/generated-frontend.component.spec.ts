import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneratedFrontendComponent } from './generated-frontend.component';

describe('GeneratedFrontendComponent', () => {
  let component: GeneratedFrontendComponent;
  let fixture: ComponentFixture<GeneratedFrontendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeneratedFrontendComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneratedFrontendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
