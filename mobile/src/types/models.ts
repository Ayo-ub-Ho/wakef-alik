/**
 * Model types for the mobile application
 */

// GeoJSON Point format for location data
export type GeoJSONPoint = {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
};

// Vehicle types for drivers
export type VehicleType = 'BIKE' | 'MOTORCYCLE' | 'CAR' | 'VAN';

// Driver profile model
export interface DriverProfile {
  _id?: string;
  userId?: string;
  vehicleType: VehicleType;
  hasDeliveryBox?: boolean;
  isAvailable?: boolean;
  isVerified?: boolean;
  currentLocation?: GeoJSONPoint;
  createdAt?: string;
  updatedAt?: string;
}

// Restaurant profile model
export interface RestaurantProfile {
  _id?: string;
  userId?: string;
  restaurantName: string;
  ownerName: string;
  addressText: string;
  location: GeoJSONPoint;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Payload types for creating/updating profiles
export interface CreateDriverProfilePayload {
  vehicleType: VehicleType;
  hasDeliveryBox?: boolean;
}

export interface UpdateDriverProfilePayload {
  vehicleType?: VehicleType;
  hasDeliveryBox?: boolean;
  isAvailable?: boolean;
  currentLocation?: GeoJSONPoint;
}

export interface CreateRestaurantProfilePayload {
  restaurantName: string;
  ownerName: string;
  addressText: string;
  location: GeoJSONPoint;
}

export interface UpdateRestaurantProfilePayload {
  restaurantName?: string;
  ownerName?: string;
  addressText?: string;
  location?: GeoJSONPoint;
}

// Delivery request status types
export type DeliveryStatus =
  | 'PENDING'
  | 'PROPOSED'
  | 'ACCEPTED'
  | 'IN_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

// Delivery request model
export interface DeliveryRequest {
  _id: string;
  restaurantId: string;
  pickupLocation: GeoJSONPoint;
  pickupAddressText: string;
  dropoffLocation: GeoJSONPoint;
  dropoffAddressText: string;
  deliveryFee: number;
  notes?: string;
  status: DeliveryStatus;
  createdAt: string;
}

// Payload for creating a delivery request
export interface CreateRequestPayload {
  restaurantId: string;
  pickupLocation: GeoJSONPoint;
  pickupAddressText: string;
  dropoffLocation: GeoJSONPoint;
  dropoffAddressText: string;
  deliveryFee: number;
  notes?: string;
}

// Offer state types
export type OfferState = 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

// Request offer model (from driver perspective)
export interface RequestOffer {
  _id: string;
  requestId: string;
  driverId: string;
  state: OfferState;
  proposedFee?: number;
  message?: string;
  sentAt: string;
  respondedAt?: string;
  // Populated fields
  request?: DeliveryRequest & {
    restaurant?: {
      restaurantName: string;
      addressText: string;
    };
  };
}

// Nearby request model (includes distance)
export interface NearbyRequest {
  _id: string;
  restaurantId: string;
  pickupLocation: GeoJSONPoint;
  pickupAddressText: string;
  dropoffLocation: GeoJSONPoint;
  dropoffAddressText: string;
  deliveryFee: number;
  notes?: string;
  status: DeliveryStatus;
  createdAt: string;
  distance?: number; // Distance in meters
  restaurant?: {
    restaurantName: string;
    addressText: string;
  };
}

// Active delivery model (driver's accepted delivery)
export interface ActiveDelivery {
  _id: string;
  requestId: string;
  driverId: string;
  status: DeliveryStatus;
  acceptedAt: string;
  request?: DeliveryRequest & {
    restaurant?: {
      restaurantName: string;
      addressText: string;
    };
  };
}

