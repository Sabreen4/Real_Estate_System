import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PropertyService, PropertyFilters } from 'src/app/core/services/property.service';
import { environment } from 'src/environments/environment';

describe('PropertyService', () => {
  let service: PropertyService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/properties`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:   [HttpClientTestingModule],
      providers: [PropertyService]
    });
    service  = TestBed.inject(PropertyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ─── getProperties ─────────────────────────────────────────────────────────

  describe('getProperties()', () => {

    it('should GET /properties with no query params when filters object is empty', () => {
      service.getProperties({}).subscribe(props => expect(props).toEqual([]));

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.method).toBe('GET');
      // no params appended for an empty filter object
      expect(req.request.params.keys().length).toBe(0);
      req.flush([]);
    });

    it('should append non-null, non-undefined, non-empty string values as query params', () => {
      const filters: PropertyFilters = { city: 'Cairo', propertyTypeId: '1' };
      service.getProperties(filters).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.get('city')).toBe('Cairo');
      expect(req.request.params.get('propertyTypeId')).toBe('1');
      req.flush([]);
    });

    it('should skip null filter values', () => {
      const filters: PropertyFilters = { city: null as any, minPrice: null };
      service.getProperties(filters).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.has('city')).toBeFalse();
      expect(req.request.params.has('minPrice')).toBeFalse();
      req.flush([]);
    });

    it('should skip undefined filter values', () => {
      const filters: PropertyFilters = { listingTypeId: undefined };
      service.getProperties(filters).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.has('listingTypeId')).toBeFalse();
      req.flush([]);
    });

    it('should skip empty string filter values', () => {
      const filters: PropertyFilters = { city: '' };
      service.getProperties(filters).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.has('city')).toBeFalse();
      req.flush([]);
    });

    it('should include minPrice / maxPrice of 0 (falsy but valid)', () => {
      const filters: PropertyFilters = { minPrice: 0, maxPrice: 0 };
      service.getProperties(filters).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.get('minPrice')).toBe('0');
      expect(req.request.params.get('maxPrice')).toBe('0');
      req.flush([]);
    });

    it('should return the array of properties emitted by the HTTP response', () => {
      const mock = [{ id: 1, title: 'House A' }, { id: 2, title: 'Villa B' }];
      service.getProperties({ city: 'Cairo' }).subscribe(props => {
        expect(props.length).toBe(2);
        expect(props[0].title).toBe('House A');
        expect(props[1].title).toBe('Villa B');
      });

      const req = httpMock.expectOne(r => r.url === apiUrl);
      req.flush(mock);
    });

    it('should include multiple filters simultaneously', () => {
      const filters: PropertyFilters = {
        city:           'Alex',
        propertyTypeId: '2',
        listingTypeId:  '1',
        minPrice:       100000,
        maxPrice:       500000
      };
      service.getProperties(filters).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.get('city')).toBe('Alex');
      expect(req.request.params.get('propertyTypeId')).toBe('2');
      expect(req.request.params.get('listingTypeId')).toBe('1');
      expect(req.request.params.get('minPrice')).toBe('100000');
      expect(req.request.params.get('maxPrice')).toBe('500000');
      req.flush([]);
    });

  });

});