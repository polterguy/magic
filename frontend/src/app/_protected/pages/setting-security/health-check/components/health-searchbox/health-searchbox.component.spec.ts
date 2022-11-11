import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthSearchboxComponent } from './health-searchbox.component';

describe('HealthSearchboxComponent', () => {
  let component: HealthSearchboxComponent;
  let fixture: ComponentFixture<HealthSearchboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HealthSearchboxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HealthSearchboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
