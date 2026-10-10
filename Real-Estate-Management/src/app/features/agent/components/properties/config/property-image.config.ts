import { Property, PropertyImage } from 'src/app/core/models/property.model';

export interface ExistingImage extends PropertyImage {
  previewUrl: string | null;
}

export const IMAGE_UPLOAD_MAX = 10;

export function mapPropertyImages(raw: Property[]): Property[] {
  return raw.map((p: Property) => ({
    ...p,
    imageUrl: p.images?.length && p.images[0]?.base64
      ? `data:${p.images[0].contentType || 'image/jpeg'};base64,${p.images[0].base64}`
      : undefined,
  }));
}

export function buildPreviewUrls(p: Property): string[] {
  const imgs: string[] = (p.images ?? [])
    .filter((img: PropertyImage) => img.base64)
    .map((img: PropertyImage) =>
      `data:${img.contentType || 'image/jpeg'};base64,${img.base64}`
    );
  if (imgs.length === 0 && p.imageUrl) imgs.push(p.imageUrl);
  return imgs;
}