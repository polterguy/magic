import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntroGuideComponent } from './intro-guide.component';

describe('IntroGuideComponent', () => {
  let component: IntroGuideComponent;
  let fixture: ComponentFixture<IntroGuideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IntroGuideComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IntroGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
