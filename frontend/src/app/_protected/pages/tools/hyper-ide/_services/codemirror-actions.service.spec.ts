import { TestBed } from '@angular/core/testing';

import { CodemirrorActionsService } from './codemirror-actions.service';

describe('CodemirrorActionsService', () => {
  let service: CodemirrorActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CodemirrorActionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
