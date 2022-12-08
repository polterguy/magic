import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneratedSocketsComponent } from './generated-sockets.component';

describe('GeneratedSocketsComponent', () => {
  let component: GeneratedSocketsComponent;
  let fixture: ComponentFixture<GeneratedSocketsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeneratedSocketsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneratedSocketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
