export interface IGeoPoint {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
}

export type DeliveryStatus = 
    | 'PENDING' 
    | 'PROPOSED' 
    | 'ACCEPTED' 
    | 'IN_DELIVERY' 
    | 'DELIVERED' 
    | 'CANCELLED';

export type OfferState = 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';