import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodemirrorHyperlambdaComponent } from './codemirror-hyperlambda.component';

describe('CodemirrorHyperlambdaComponent', () => {
  let component: CodemirrorHyperlambdaComponent;
  let fixture: ComponentFixture<CodemirrorHyperlambdaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CodemirrorHyperlambdaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodemirrorHyperlambdaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
