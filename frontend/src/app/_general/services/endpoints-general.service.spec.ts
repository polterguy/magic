import { TestBed } from '@angular/core/testing';

import { EndpointsGeneralService } from './endpoints-general.service';

describe('EndpointsGeneralService', () => {
  let service: EndpointsGeneralService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EndpointsGeneralService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
