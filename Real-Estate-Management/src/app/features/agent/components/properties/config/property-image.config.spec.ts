import {
  IMAGE_UPLOAD_MAX,
  mapPropertyImages,
  buildPreviewUrls,
} from './property-image.config';
import { Property, PropertyImage } from 'src/app/core/models/property.model';

function makeImage(overrides: Partial<PropertyImage> = {}): PropertyImage {
  return { id: 1, ...overrides } as PropertyImage;  // only use fields that exist on PropertyImage
}

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: 1, title: 'Test', city: 'Chennai', price: 100000,
    userId: 1, agentId: 1, images: [], imageUrl: undefined, ...overrides,
  } as Property;
}

describe('IMAGE_UPLOAD_MAX', () => {
  it('should be 10', () => {
    expect(IMAGE_UPLOAD_MAX).toBe(10);
  });
});

describe('mapPropertyImages', () => {
  it('sets imageUrl from first image base64', () => {
    const p = makeProperty({ images: [makeImage({ base64: 'abc', contentType: 'image/png' })] });
    const [result] = mapPropertyImages([p]);
    expect(result.imageUrl).toBe('data:image/png;base64,abc');
  });

  it('defaults contentType to image/jpeg when missing', () => {
    const p = makeProperty({ images: [makeImage({ base64: 'xyz', contentType: undefined })] });
    const [result] = mapPropertyImages([p]);
    expect(result.imageUrl).toBe('data:image/jpeg;base64,xyz');
  });

  it('sets imageUrl to undefined when no images', () => {
    const p = makeProperty({ images: [] });
    const [result] = mapPropertyImages([p]);
    expect(result.imageUrl).toBeUndefined();
  });

  it('sets imageUrl to undefined when first image has no base64', () => {
    const p = makeProperty({ images: [makeImage({ base64: undefined })] });
    const [result] = mapPropertyImages([p]);
    expect(result.imageUrl).toBeUndefined();
  });

  it('handles empty array without throwing', () => {
    expect(() => mapPropertyImages([])).not.toThrow();
    expect(mapPropertyImages([])).toEqual([]);
  });

  it('maps multiple properties independently', () => {
    const p1 = makeProperty({ id: 1, images: [makeImage({ base64: 'aaa' })] });
    const p2 = makeProperty({ id: 2, images: [] });
    const [r1, r2] = mapPropertyImages([p1, p2]);
    expect(r1.imageUrl).toContain('aaa');
    expect(r2.imageUrl).toBeUndefined();
  });
});

describe('buildPreviewUrls', () => {
  it('builds URLs from base64 images', () => {
    const p = makeProperty({
      images: [makeImage({ base64: 'abc', contentType: 'image/png' })],
    });
    const urls = buildPreviewUrls(p);
    expect(urls).toEqual(['data:image/png;base64,abc']);
  });

  it('defaults contentType to image/jpeg', () => {
    const p = makeProperty({
      images: [makeImage({ base64: 'xyz', contentType: undefined })],
    });
    const [url] = buildPreviewUrls(p);
    expect(url).toContain('image/jpeg');
  });

  it('falls back to imageUrl when no base64 images', () => {
    const p = makeProperty({ images: [], imageUrl: 'https://example.com/img.jpg' });
    expect(buildPreviewUrls(p)).toEqual(['https://example.com/img.jpg']);
  });

  it('returns empty array when no images and no imageUrl', () => {
    const p = makeProperty({ images: [], imageUrl: undefined });
    expect(buildPreviewUrls(p)).toEqual([]);
  });

  it('skips images without base64', () => {
    const p = makeProperty({
      images: [
        makeImage({ base64: undefined }),
        makeImage({ base64: 'valid', contentType: 'image/jpeg' }),
      ],
    });
    const urls = buildPreviewUrls(p);
    expect(urls.length).toBe(1);
    expect(urls[0]).toContain('valid');
  });

  it('handles undefined images array', () => {
    const p = makeProperty({ images: undefined });
    expect(() => buildPreviewUrls(p)).not.toThrow();
  });
});