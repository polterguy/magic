import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocketSearchboxComponent } from './socket-searchbox.component';

describe('SocketSearchboxComponent', () => {
  let component: SocketSearchboxComponent;
  let fixture: ComponentFixture<SocketSearchboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SocketSearchboxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SocketSearchboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
