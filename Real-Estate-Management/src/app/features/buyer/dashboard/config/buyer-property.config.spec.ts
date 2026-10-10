import {processPropertyResponse,buildPropertyFromOffer,PropertyApiResponse,} from './buyer-property.config';
import { Property, PropertyImage } from 'src/app/core/models/property.model';
import { Offer } from 'src/app/core/models/offer.model';

function makeImage(overrides: Partial<PropertyImage> = {}): PropertyImage {
  return { id: 1, propertyId: 1, base64: 'abc123', contentType: 'image/jpeg', ...overrides };
}

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: 1, title: 'Test', description: 'Desc', city: 'Chennai',
    state: 'TN', price: 500000, size: 1200, zipCode: '600001',
    propertyType: 'Apartment', listingType: 'For Sale', status: 'ACTIVE',
    userId: 1, propertyTypeId: 40, listingTypeId: 70, statusId: 100,
    agentId: 2, images: [],
    ...overrides,
  } as Property;
}

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: 10, propertyId: 5, propertyTitle: 'Offer Property',
    offerAmount: 750000, city: 'Mumbai',
    agentId: 3, sellerId: undefined, agentUserId: undefined,
    status: 'PENDING',
    ...overrides,
  } as Offer;
}

// ── processPropertyResponse ───────────────────────────────────────────────────

describe('processPropertyResponse', () => {
  it('handles paged response with items array', () => {
    const response: PropertyApiResponse = { items: [makeProperty()] };
    const result = processPropertyResponse(response);
    expect(result.length).toBe(1);
  });

  it('handles plain array response', () => {
    const result = processPropertyResponse([makeProperty()]);
    expect(result.length).toBe(1);
  });

  it('filters out non-ACTIVE properties', () => {
    const props = [
      makeProperty({ status: 'ACTIVE' }),
      makeProperty({ id: 2, status: 'SOLD' }),
      makeProperty({ id: 3, status: 'PENDING' }),
    ];
    const result = processPropertyResponse(props);
    expect(result.length).toBe(1);
    expect(result[0].status).toBe('ACTIVE');
  });

  it('is case-insensitive for ACTIVE status', () => {
    const result = processPropertyResponse([makeProperty({ status: 'active' as any })]);
    expect(result.length).toBe(1);
  });

  it('builds processedImages from base64 images', () => {
    const p = makeProperty({ images: [makeImage({ base64: 'xyz', contentType: 'image/png' })] });
    const [result] = processPropertyResponse([p]);
    expect(result.processedImages).toEqual(['data:image/png;base64,xyz']);
  });

  it('excludes images without base64 from processedImages', () => {
    const p = makeProperty({
      images: [
        makeImage({ base64: undefined }),
        makeImage({ base64: 'valid', contentType: 'image/jpeg' }),
      ],
    });
    const [result] = processPropertyResponse([p]);
    expect(result.processedImages!.length).toBe(1);
    expect(result.processedImages![0]).toContain('valid');
  });

  it('sets imageUrl from first image base64', () => {
    const p = makeProperty({ images: [makeImage({ base64: 'first', contentType: 'image/jpeg' })] });
    const [result] = processPropertyResponse([p]);
    expect(result.imageUrl).toBe('data:image/jpeg;base64,first');
  });

  it('falls back to default image when no base64', () => {
    const p = makeProperty({ images: [] });
    const [result] = processPropertyResponse([p]);
    expect(result.imageUrl).toBe('assets/default-house.jpg');
  });

  it('defaults contentType to image/jpeg when missing', () => {
    const p = makeProperty({ images: [makeImage({ base64: 'abc', contentType: undefined })] });
    const [result] = processPropertyResponse([p]);
    expect(result.imageUrl).toContain('image/jpeg');
  });

  it('defaults agentId to userId when agentId is missing', () => {
    const p = makeProperty({ agentId: undefined, userId: 99 });
    const [result] = processPropertyResponse([p]);
    expect(result.agentId).toBe(99);
  });

  it('returns empty array for empty input', () => {
    expect(processPropertyResponse([])).toEqual([]);
  });

  it('returns empty array for empty items wrapper', () => {
    expect(processPropertyResponse({ items: [] })).toEqual([]);
  });

  it('handles missing images array without throwing', () => {
    const p = makeProperty({ images: undefined as any });
    expect(() => processPropertyResponse([p])).not.toThrow();
  });
});

// ── buildPropertyFromOffer ────────────────────────────────────────────────────

describe('buildPropertyFromOffer', () => {
  it('uses offer propertyId as property id', () => {
    const result = buildPropertyFromOffer(makeOffer({ propertyId: 42 }));
    expect(result.id).toBe(42);
  });

  it('uses offer propertyTitle as title', () => {
    const result = buildPropertyFromOffer(makeOffer({ propertyTitle: 'Nice Flat' }));
    expect(result.title).toBe('Nice Flat');
  });

  it('falls back to "Property" when propertyTitle is missing', () => {
    const result = buildPropertyFromOffer(makeOffer({ propertyTitle: undefined }));
    expect(result.title).toBe('Property');
  });

  it('uses offerAmount as price', () => {
    const result = buildPropertyFromOffer(makeOffer({ offerAmount: 999000 }));
    expect(result.price).toBe(999000);
  });

  it('uses offer city', () => {
    const result = buildPropertyFromOffer(makeOffer({ city: 'Delhi' }));
    expect(result.city).toBe('Delhi');
  });

  it('falls back to empty string when city is missing', () => {
    const result = buildPropertyFromOffer(makeOffer({ city: undefined }));
    expect(result.city).toBe('');
  });

  it('uses agentId from offer.agentId', () => {
    const result = buildPropertyFromOffer(makeOffer({ agentId: 7 }));
    expect(result.agentId).toBe(7);
  });

  it('falls back to sellerId when agentId is missing', () => {
    const result = buildPropertyFromOffer(makeOffer({ agentId: undefined, sellerId: 8 }));
    expect(result.agentId).toBe(8);
  });

  it('falls back to agentUserId when agentId and sellerId are missing', () => {
    const result = buildPropertyFromOffer(
      makeOffer({ agentId: undefined, sellerId: undefined, agentUserId: 9 })
    );
    expect(result.agentId).toBe(9);
  });

  it('falls back to 0 when all agent fields are missing', () => {
    const result = buildPropertyFromOffer(
      makeOffer({ agentId: undefined, sellerId: undefined, agentUserId: undefined })
    );
    expect(result.agentId).toBe(0);
  });

  it('sets status to ACTIVE', () => {
    expect(buildPropertyFromOffer(makeOffer()).status).toBe('ACTIVE');
  });

  it('sets images to empty array', () => {
    expect(buildPropertyFromOffer(makeOffer()).images).toEqual([]);
  });

  it('sets imageUrl to empty string', () => {
    expect(buildPropertyFromOffer(makeOffer()).imageUrl).toBe('');
  });
});