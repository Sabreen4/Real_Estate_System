import { Property, PropertyImage } from 'src/app/core/models/property.model';
import { Offer } from 'src/app/core/models/offer.model';

export interface PropertyApiResponse {
  items?: Property[];
}

export function processPropertyResponse(response: Property[] | PropertyApiResponse): Property[] {
  const data: Property[] = (response as PropertyApiResponse)?.items
    ?? (response as Property[])
    ?? [];

  return data
    .filter((p: Property) => p.status?.toUpperCase() === 'ACTIVE')
    .map((p: Property) => ({
      id:             p.id,
      title:          p.title,
      description:    p.description,
      city:           p.city,
      state:          p.state,
      price:          p.price,
      size:           p.size,
      zipCode:        p.zipCode,
      propertyType:   p.propertyType,
      listingType:    p.listingType,
      status:         p.status,
      userId:         p.userId,
      propertyTypeId: p.propertyTypeId,
      listingTypeId:  p.listingTypeId,
      statusId:       p.statusId,
      agentId:        p.agentId ?? p.userId ?? 0,
      images:         p.images ?? [],
      processedImages: (p.images ?? [])
        .map((img: PropertyImage) =>
          img.base64
            ? `data:${img.contentType || 'image/jpeg'};base64,${img.base64}`
            : null
        )
        .filter((s): s is string => s !== null),
      imageUrl: p.images?.length && p.images[0]?.base64
        ? `data:${p.images[0].contentType || 'image/jpeg'};base64,${p.images[0].base64}`
        : 'assets/default-house.jpg',
    }));
}

export function buildPropertyFromOffer(offer: Offer): Property {
  const agentId =
    offer.agentId ??
    offer.sellerId ??
    offer.agentUserId ??
    0;

  return {
    id:             offer.propertyId,
    title:          offer.propertyTitle || 'Property',
    price:          offer.offerAmount,
    imageUrl:       '',
    city:           offer.city || '',
    state:          '',
    description:    '',
    size:           0,
    zipCode:        '',
    propertyType:   '',
    listingType:    '',
    status:         'ACTIVE',
    userId:         0,
    propertyTypeId: 0,
    listingTypeId:  0,
    statusId:       0,
    agentId,
    images:         [],
  } as Property;
}