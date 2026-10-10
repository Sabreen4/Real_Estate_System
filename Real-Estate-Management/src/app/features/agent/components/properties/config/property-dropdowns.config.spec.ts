import { PROPERTY_TYPES, LISTING_TYPES, STATUSES } from './property-dropdowns.config';

describe('PROPERTY_TYPES', () => {
  it('should contain 5 property types', () => {
    expect(PROPERTY_TYPES.length).toBe(5);
  });

  it('should include Apartment with id 40', () => {
    expect(PROPERTY_TYPES).toContain(jasmine.objectContaining({ id: 40, label: 'Apartment' }));
  });

  it('should include House with id 50', () => {
    expect(PROPERTY_TYPES).toContain(jasmine.objectContaining({ id: 50, label: 'House' }));
  });

  it('should include Commercial with id 60', () => {
    expect(PROPERTY_TYPES).toContain(jasmine.objectContaining({ id: 60, label: 'Commercial' }));
  });

  it('should include Villa with id 70', () => {
    expect(PROPERTY_TYPES).toContain(jasmine.objectContaining({ id: 70, label: 'Villa' }));
  });

  it('should include Plot with id 80', () => {
    expect(PROPERTY_TYPES).toContain(jasmine.objectContaining({ id: 80, label: 'Plot' }));
  });
});

describe('LISTING_TYPES', () => {
  it('should contain 3 listing types', () => {
    expect(LISTING_TYPES.length).toBe(3);
  });

  it('should include For Sale with id 70', () => {
    expect(LISTING_TYPES).toContain(jasmine.objectContaining({ id: 70, label: 'For Sale' }));
  });

  it('should include For Rent with id 80', () => {
    expect(LISTING_TYPES).toContain(jasmine.objectContaining({ id: 80, label: 'For Rent' }));
  });

  it('should include Lease with id 90', () => {
    expect(LISTING_TYPES).toContain(jasmine.objectContaining({ id: 90, label: 'Lease' }));
  });
});

describe('STATUSES', () => {
  it('should contain 3 statuses', () => {
    expect(STATUSES.length).toBe(3);
  });

  it('should include Active with id 100', () => {
    expect(STATUSES).toContain(jasmine.objectContaining({ id: 100, label: 'Active' }));
  });

  it('should include Pending with id 200', () => {
    expect(STATUSES).toContain(jasmine.objectContaining({ id: 200, label: 'Pending' }));
  });

  it('should include Sold with id 300', () => {
    expect(STATUSES).toContain(jasmine.objectContaining({ id: 300, label: 'Sold' }));
  });
});