import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualGeneratorComponent } from './manual-generator.component';

describe('ManualGeneratorComponent', () => {
  let component: ManualGeneratorComponent;
  let fixture: ComponentFixture<ManualGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManualGeneratorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManualGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
