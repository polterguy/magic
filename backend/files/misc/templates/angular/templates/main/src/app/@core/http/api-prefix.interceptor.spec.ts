import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';

import { environment } from '@env/environment';
import { ApiPrefixInterceptor } from './api-prefix.interceptor';

describe('ApiPrefixInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: ApiPrefixInterceptor,
          multi: true,
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController as Type<HttpTestingController>);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should prepend environment.apiUrl to the request url', () => {
    // Act
    http.get('/toto').subscribe();

    // Assert
    httpMock.expectOne({ url: environment.apiUrl + '/toto' });
  });

  it('should not prepend environment.apiUrl to request url', () => {
    // Act
    http.get('hTtPs://domain.com/toto').subscribe();

    // Assert
    httpMock.expectOne({ url: 'hTtPs://domain.com/toto' });
  });
});
