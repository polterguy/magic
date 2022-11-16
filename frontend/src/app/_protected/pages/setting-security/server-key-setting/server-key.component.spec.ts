import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerKeyComponent } from './server-key.component';

describe('ServerKeyComponent', () => {
  let component: ServerKeyComponent;
  let fixture: ComponentFixture<ServerKeyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServerKeyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServerKeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
