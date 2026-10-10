export interface Offer {
  id: number;
  offerId?: number;
  propertyId: number;
  propertyTitle?: string;
  propertyName?: string;    // used in template: o.propertyName
  buyerId?: number;
  buyerName?: string;       // used in template: o.buyerName
  buyerEmail?: string;      // used in template: o.buyerEmail
  agentId?: number;
  sellerId?: number;
  agentUserId?: number;
  offerAmount: number;
  status: string;
  message?: string;         // used in template: o.message
  city?: string;
}