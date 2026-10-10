import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AgentPropertyService } from 'src/app/core/services/agent-property.service';
import { Property } from 'src/app/core/models/property.model';
import { environment } from 'src/environments/environment';

describe('AgentPropertyService', () => {
  let service: AgentPropertyService;
  let httpMock: HttpTestingController;

  const apiUrl  = `${environment.apiUrl}/properties`;
  const gateway = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:   [HttpClientTestingModule],
      providers: [AgentPropertyService]
    });
    service  = TestBed.inject(AgentPropertyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ─── getAgentProperties ────────────────────────────────────────────────────

  describe('getAgentProperties()', () => {

    it('should GET /properties with default pagination params (no args)', () => {
      service.getAgentProperties().subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('pageNumber')).toBe('1');
      expect(req.request.params.get('pageSize')).toBe('10');
      // no userId when not supplied
      expect(req.request.params.has('userId')).toBeFalse();
      req.flush({ items: [], totalCount: 0 });
    });

    it('should include userId param when agentUserId is provided', () => {
      service.getAgentProperties(42).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.get('userId')).toBe('42');
      req.flush({ items: [], totalCount: 0 });
    });

    it('should title-case the location and set City param', () => {
      service.getAgentProperties(1, { location: 'new york' }).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.get('City')).toBe('New York');
      req.flush({ items: [], totalCount: 0 });
    });

    it('should set all filter params when all filters are provided', () => {
      service.getAgentProperties(1, {
        location:     'new york',
        selectedType: '2',
        listingType:  '1',
        status:       '3',
        minPrice:     100000,
        maxPrice:     500000
      }).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.get('City')).toBe('New York');
      expect(req.request.params.get('PropertyTypeId')).toBe('2');
      expect(req.request.params.get('ListingTypeId')).toBe('1');
      expect(req.request.params.get('StatusId')).toBe('3');
      expect(req.request.params.get('MinPrice')).toBe('100000');
      expect(req.request.params.get('MaxPrice')).toBe('500000');
      req.flush({ items: [], totalCount: 0 });
    });

    it('should NOT set City when location is an empty string', () => {
      service.getAgentProperties(1, { location: '' }).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.has('City')).toBeFalse();
      req.flush({ items: [], totalCount: 0 });
    });

    it('should NOT set City when location is only whitespace', () => {
      service.getAgentProperties(1, { location: '   ' }).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.has('City')).toBeFalse();
      req.flush({ items: [], totalCount: 0 });
    });

    it('should NOT set PropertyTypeId when selectedType is empty string', () => {
      service.getAgentProperties(1, { selectedType: '' }).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.has('PropertyTypeId')).toBeFalse();
      req.flush({ items: [], totalCount: 0 });
    });

    it('should NOT set ListingTypeId when listingType is empty string', () => {
      service.getAgentProperties(1, { listingType: '' }).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.has('ListingTypeId')).toBeFalse();
      req.flush({ items: [], totalCount: 0 });
    });

    it('should NOT set StatusId when status is empty string', () => {
      service.getAgentProperties(1, { status: '' }).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.has('StatusId')).toBeFalse();
      req.flush({ items: [], totalCount: 0 });
    });

    it('should NOT set MinPrice / MaxPrice when they are null', () => {
      service.getAgentProperties(1, { minPrice: null, maxPrice: null }).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.has('MinPrice')).toBeFalse();
      expect(req.request.params.has('MaxPrice')).toBeFalse();
      req.flush({ items: [], totalCount: 0 });
    });

    it('should set MinPrice when minPrice is 0 (falsy but != null)', () => {
      service.getAgentProperties(1, { minPrice: 0 }).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.get('MinPrice')).toBe('0');
      req.flush({ items: [], totalCount: 0 });
    });

    it('should set MaxPrice when maxPrice is 0 (falsy but != null)', () => {
      service.getAgentProperties(1, { maxPrice: 0 }).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.get('MaxPrice')).toBe('0');
      req.flush({ items: [], totalCount: 0 });
    });

    it('should use custom page and pageSize params', () => {
      service.getAgentProperties(undefined, null, 3, 20).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.get('pageNumber')).toBe('3');
      expect(req.request.params.get('pageSize')).toBe('20');
      req.flush({ items: [], totalCount: 0 });
    });

    it('should work when filters is null', () => {
      service.getAgentProperties(1, null).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.has('City')).toBeFalse();
      expect(req.request.params.has('PropertyTypeId')).toBeFalse();
      req.flush({ items: [], totalCount: 0 });
    });

  });

  // ─── getPropertyById ───────────────────────────────────────────────────────

  describe('getPropertyById()', () => {

    it('should GET /properties/:id and return the property', () => {
      service.getPropertyById(7).subscribe(p => {
        expect(p).toBeTruthy();
        expect((p as any).id).toBe(7);
      });

      const req = httpMock.expectOne(`${apiUrl}/7`);
      expect(req.request.method).toBe('GET');
      req.flush({ id: 7, title: 'Test Property' });
    });

  });

  // ─── createProperty ────────────────────────────────────────────────────────

  describe('createProperty()', () => {

    it('should POST /properties with the supplied data', () => {
      const data = { title: 'New Villa', price: 200000 };
      service.createProperty(data).subscribe(p => {
        expect(p).toBeTruthy();
        expect((p as any).id).toBe(99);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(data);
      req.flush({ id: 99, ...data });
    });

  });

  // ─── updateProperty ────────────────────────────────────────────────────────

  describe('updateProperty()', () => {

    it('should PUT /properties/:id and send a FormData body', () => {
      const data = {
        title:          'Updated',
        description:    'desc',
        city:           'Cairo',
        state:          'CA',
        zipCode:        '12345',
        price:          150000,
        size:           200,
        propertyTypeId: 1,
        listingTypeId:  2,
        statusId:       1
      };

      service.updateProperty(5, data).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/5`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body instanceof FormData).toBeTrue();

      const body = req.request.body as FormData;
      expect(body.get('id')).toBe('5');
      expect(body.get('title')).toBe('Updated');
      expect(body.get('city')).toBe('Cairo');
      expect(body.get('price')).toBe('150000');
      expect(body.get('size')).toBe('200');
      expect(body.get('propertyTypeId')).toBe('1');
      expect(body.get('listingTypeId')).toBe('2');
      expect(body.get('statusId')).toBe('1');

      req.flush({ id: 5 });
    });

    it('should use empty strings / zeros for null-ish values in FormData', () => {
      const data: Partial<Property> = {
        title:          undefined,
        description:    undefined,
        city:           undefined,
        state:          undefined,
        zipCode:        undefined,
        price:          undefined,
        size:           undefined,
        propertyTypeId: 1,
        listingTypeId:  2,
        statusId:       3
      };

      service.updateProperty(10, data).subscribe();

      const req  = httpMock.expectOne(`${apiUrl}/10`);
      expect(req.request.method).toBe('PUT');

      const body = req.request.body as FormData;
      expect(body.get('title')).toBe('');
      expect(body.get('description')).toBe('');
      expect(body.get('city')).toBe('');
      expect(body.get('state')).toBe('');
      expect(body.get('zipCode')).toBe('');
      expect(body.get('price')).toBe('0');
      expect(body.get('size')).toBe('0');

      req.flush({});
    });

  });

  // ─── deleteProperty ────────────────────────────────────────────────────────

  describe('deleteProperty()', () => {

    it('should DELETE /properties/:id', () => {
      service.deleteProperty(3).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/3`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

  });

  // ─── uploadImages ──────────────────────────────────────────────────────────

  describe('uploadImages()', () => {

    it('should POST /properties/:id/images with a FormData body containing the files', () => {
      const file = new File(['content'], 'img.jpg', { type: 'image/jpeg' });
      service.uploadImages(10, [file]).subscribe(imgs => expect(imgs).toEqual([]));

      const req = httpMock.expectOne(`${gateway}/properties/10/images`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();

      const body = req.request.body as FormData;
      // The file must be appended under the key 'files'
      expect(body.get('files')).toBeTruthy();

      req.flush([]);
    });

    it('should handle multiple files in a single upload', () => {
      const files = [
        new File(['a'], 'a.jpg', { type: 'image/jpeg' }),
        new File(['b'], 'b.jpg', { type: 'image/jpeg' })
      ];
      service.uploadImages(10, files).subscribe();

      const req  = httpMock.expectOne(`${gateway}/properties/10/images`);
      const body = req.request.body as FormData;
      const all  = body.getAll('files');
      expect(all.length).toBe(2);
      req.flush([]);
    });

  });

  // ─── getImages ─────────────────────────────────────────────────────────────

  describe('getImages()', () => {

    it('should GET /properties/:id/images and return the list', () => {
      service.getImages(10).subscribe(imgs => {
        expect(imgs.length).toBe(1);
        expect(imgs[0].id).toBe(1);
      });

      const req = httpMock.expectOne(`${gateway}/properties/10/images`);
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 1, url: 'img.jpg' }]);
    });

  });

  // ─── deleteImages ──────────────────────────────────────────────────────────

  describe('deleteImages()', () => {

    it('should DELETE /properties/:id/images with the ids array as the request body', () => {
      service.deleteImages(10, [1, 2]).subscribe();

      const req = httpMock.expectOne(`${gateway}/properties/10/images`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toEqual([1, 2]);
      req.flush({});
    });

  });

});