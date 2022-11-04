import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneratedEndpointsComponent } from './generated-endpoints.component';

describe('GeneratedEndpointsComponent', () => {
  let component: GeneratedEndpointsComponent;
  let fixture: ComponentFixture<GeneratedEndpointsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeneratedEndpointsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneratedEndpointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
