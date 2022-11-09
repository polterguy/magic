import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneratedBackendComponent } from './generated-backend.component';

describe('GeneratedBackendComponent', () => {
  let component: GeneratedBackendComponent;
  let fixture: ComponentFixture<GeneratedBackendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeneratedBackendComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneratedBackendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
