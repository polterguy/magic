import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontendEditorComponent } from './frontend-editor.component';

describe('FrontendEditorComponent', () => {
  let component: FrontendEditorComponent;
  let fixture: ComponentFixture<FrontendEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FrontendEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FrontendEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
