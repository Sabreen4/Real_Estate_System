export interface Property {
  id: number;
  userId: number;
  title: string;
  description: string;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  size: number;
  propertyTypeId: number;
  propertyType: string;
  listingTypeId: number;
  listingType: string;
  statusId: number;
  status: string;
  agentId?: number;
  images: PropertyImage[];        // raw objects from backend
  processedImages?: string[];     // client-side derived base64 strings for sliders
  imageUrl?: string;
}

export interface PropertyImage {
  id: number;
  propertyId: number;
  imageData?: number[];
  contentType?: string;
  base64?: string;
}