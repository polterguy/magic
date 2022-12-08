import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontendGeneratorComponent } from './frontend-generator.component';

describe('FrontendGeneratorComponent', () => {
  let component: FrontendGeneratorComponent;
  let fixture: ComponentFixture<FrontendGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FrontendGeneratorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FrontendGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
