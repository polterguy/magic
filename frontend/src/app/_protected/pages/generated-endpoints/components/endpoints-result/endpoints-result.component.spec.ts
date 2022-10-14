import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EndpointsResultComponent } from './endpoints-result.component';

describe('EndpointsResultComponent', () => {
  let component: EndpointsResultComponent;
  let fixture: ComponentFixture<EndpointsResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EndpointsResultComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EndpointsResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
