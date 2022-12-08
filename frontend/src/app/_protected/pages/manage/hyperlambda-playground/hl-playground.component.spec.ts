import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HlPlaygroundComponent } from './hl-playground.component';

describe('HlPlaygroundComponent', () => {
  let component: HlPlaygroundComponent;
  let fixture: ComponentFixture<HlPlaygroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HlPlaygroundComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HlPlaygroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
