# Wakef Alik - Delivery System Implementation

## Overview

This implementation adds the core delivery request and geolocation matching functionality to the Wakef Alik food delivery platform. The system enables restaurants to create delivery requests and automatically matches them with nearby available drivers.

## Features Implemented

### 1. Data Models

#### DeliveryRequest Model

- **Collection**: `delivery_requests`
- **Fields**:
  - `restaurantId`: Reference to restaurant profile
  - `createdByUserId`: Reference to user who created the request
  - `pickupLocation`: GeoJSON Point with coordinates [lng, lat]
  - `pickupAddressText`: Human-readable pickup address
  - `dropoffLocation`: GeoJSON Point for customer location
  - `dropoffAddressText`: Human-readable dropoff address
  - `notes`: Optional delivery instructions
  - `deliveryFee`: Delivery cost
  - `status`: PENDING | PROPOSED | ACCEPTED | IN_DELIVERY | DELIVERED | CANCELLED
  - `assignedDriverId`: Reference to assigned driver (optional)
  - `assignedAt`: Timestamp when driver was assigned
  - `cancelledAt`: Timestamp if cancelled
  - `deliveredAt`: Timestamp when delivered
- **Indexes**:
  - `pickupLocation`: 2dsphere index for geospatial queries
  - `(restaurantId, createdAt)`: For restaurant's request history
  - `(status, createdAt)`: For filtering by status
  - `assignedDriverId`: For driver's active deliveries

#### RequestOffer Model

- **Collection**: `request_offers`
- **Fields**:
  - `requestId`: Reference to delivery request
  - `driverId`: Reference to driver profile
  - `state`: SENT | ACCEPTED | REJECTED | EXPIRED
  - `sentAt`: When offer was sent
  - `respondedAt`: When driver responded (optional)
  - `expiresAt`: Offer expiration time (2 minutes from sentAt)
- **Indexes**:
  - `(requestId, driverId)`: Unique constraint
  - `(driverId, state, sentAt)`: For driver's inbox queries
  - `requestId`: For request-related lookups

### 2. API Endpoints

#### Restaurant Endpoints (Role: RESTAURANT)

**POST `/api/requests`**

- Create a new delivery request
- Automatically triggers matching with nearby drivers
- Request body:

```json
{
  "restaurantId": "string",
  "pickupLocation": {
    "type": "Point",
    "coordinates": [longitude, latitude]
  },
  "pickupAddressText": "string",
  "dropoffLocation": {
    "type": "Point",
    "coordinates": [longitude, latitude]
  },
  "dropoffAddressText": "string",
  "deliveryFee": number,
  "notes": "string" (optional)
}
```

**GET `/api/requests/my`**

- Get all delivery requests for the authenticated restaurant
- Query params: `restaurantId` (optional)
- Returns list of requests with populated restaurant and driver info

**GET `/api/requests/:id`**

- Get specific request details
- Only accessible by the restaurant that created it
- Returns populated request with full details

**PATCH `/api/requests/:id/cancel`**

- Cancel a delivery request
- Only allowed if status is PENDING or PROPOSED
- Sets status to CANCELLED and records timestamp

#### Driver Endpoints (Role: DRIVER)

**PATCH `/api/driver/location`**

- Update driver's current location
- Required for receiving delivery offers
- Request body:

```json
{
  "location": {
    "type": "Point",
    "coordinates": [longitude, latitude]
  }
}
```

**GET `/api/offers/inbox`**

- Get pending delivery offers for the driver
- Query params: `state` (optional, defaults to all states)
- Returns list of offers with populated request and restaurant info

**POST `/api/offers/:offerId/accept`**

- Accept a delivery offer (atomic operation)
- Uses optimistic locking to ensure only one driver can accept
- Automatically expires all other offers for the same request
- Returns 409 if request is no longer available

**POST `/api/offers/:offerId/reject`**

- Reject a delivery offer
- Marks offer as REJECTED with timestamp

**PATCH `/api/requests/:id/status`**

- Update delivery request status
- Only accessible by assigned driver
- Request body:

```json
{
  "status": "IN_DELIVERY" | "DELIVERED"
}
```

- Validates status transitions (must be IN_DELIVERY before DELIVERED)

**GET `/api/driver/deliveries`**

- Get driver's active deliveries
- Returns requests with status ACCEPTED or IN_DELIVERY

### 3. Matching System

#### Radius Expansion Algorithm

The system uses a progressive radius expansion strategy to find nearby drivers:

1. **First attempt**: 2km radius
2. **Second attempt**: 5km radius
3. **Third attempt**: 10km radius

The system stops after finding and creating offers for at least one driver, or after all three attempts.

#### Matching Process

1. Restaurant creates a delivery request (status: PENDING)
2. System searches for drivers within radius who are:
   - Available (`isAvailable: true`)
   - Verified (`isVerified: true`)
   - Have current location set
3. Creates RequestOffer for each found driver:
   - State: SENT
   - Expires in 2 minutes
4. Updates request status to PROPOSED
5. Drivers receive offers in their inbox

#### Offer Acceptance (Atomic Locking)

The system ensures only one driver can accept a request using MongoDB's atomic operations:

```typescript
findOneAndUpdate(
  {
    _id: requestId,
    status: { $in: ['PENDING', 'PROPOSED'] },
    assignedDriverId: { $exists: false },
  },
  {
    assignedDriverId: driverId,
    assignedAt: now,
    status: 'ACCEPTED',
  },
);
```

If successful:

- Marks the accepting driver's offer as ACCEPTED
- Expires all other offers for the same request
- Returns the updated request

If unsuccessful (race condition):

- Returns 409 Conflict
- Marks the offer as EXPIRED

### 4. Services

#### matching.service.ts

- `findNearbyDrivers()`: Uses MongoDB $geoNear aggregation
- `proposeToNearbyDrivers()`: Implements radius expansion logic
- `acceptOffer()`: Atomic offer acceptance with locking
- `rejectOffer()`: Marks offer as rejected

#### request.service.ts

- `createDeliveryRequest()`: Creates request and triggers matching
- `getRestaurantRequests()`: Fetches restaurant's requests
- `getRequestById()`: Gets specific request with ownership check
- `cancelRequest()`: Cancels request with validation
- `updateRequestStatus()`: Updates status with driver validation

#### offer.service.ts

- `updateDriverLocation()`: Updates driver's GeoJSON location
- `getDriverInbox()`: Fetches driver's pending offers
- `getDriverDeliveries()`: Gets driver's active deliveries

### 5. Security & Validation

#### Role-Based Access Control

- Restaurant endpoints require `role: 'RESTAURANT'`
- Driver endpoints require `role: 'DRIVER'`
- All endpoints require JWT authentication

#### Ownership Validation

- Restaurants can only view/cancel their own requests
- Drivers can only update status for requests assigned to them
- Drivers can only accept/reject offers sent to them

#### Input Validation

- GeoJSON coordinates validated (lng: -180 to 180, lat: -90 to 90)
- Delivery fee must be >= 0
- Status transitions validated (e.g., must be IN_DELIVERY before DELIVERED)

### 6. Verification Script

A comprehensive test script is provided: `verify-delivery-flow.js`

**Usage:**

```bash
# Make sure the backend server is running
cd backend
node verify-delivery-flow.js
```

**Test Flow:**

1. Registers a driver user
2. Creates driver profile and sets as available/verified
3. Updates driver location
4. Registers a restaurant user
5. Creates restaurant profile
6. Restaurant creates delivery request
7. Waits for matching system to create offers
8. Driver fetches inbox offers
9. Driver accepts an offer
10. Driver updates status to IN_DELIVERY
11. Driver updates status to DELIVERED
12. Restaurant checks final status

**Expected Output:**

- All steps complete with ✅
- Final status: DELIVERED
- Response status codes: 200/201

## Database Schema

### Collections

```
delivery_requests
├── restaurantId (ObjectId, ref: restaurant_profiles)
├── createdByUserId (ObjectId, ref: users)
├── pickupLocation (GeoJSON Point, 2dsphere indexed)
├── pickupAddressText (String)
├── dropoffLocation (GeoJSON Point)
├── dropoffAddressText (String)
├── notes (String, optional)
├── deliveryFee (Number, >= 0)
├── status (String enum)
├── assignedDriverId (ObjectId, ref: driver_profiles, optional)
├── assignedAt (Date, optional)
├── cancelledAt (Date, optional)
├── deliveredAt (Date, optional)
├── createdAt (Date)
└── updatedAt (Date)

request_offers
├── requestId (ObjectId, ref: delivery_requests)
├── driverId (ObjectId, ref: driver_profiles)
├── state (String enum)
├── sentAt (Date)
├── respondedAt (Date, optional)
├── expiresAt (Date, optional)
├── createdAt (Date)
└── updatedAt (Date)
```

### Indexes Summary

- `driver_profiles.currentLocation`: 2dsphere (existing)
- `delivery_requests.pickupLocation`: 2dsphere
- `delivery_requests`: (restaurantId, createdAt)
- `delivery_requests`: (status, createdAt)
- `delivery_requests`: assignedDriverId
- `request_offers`: (requestId, driverId) UNIQUE
- `request_offers`: (driverId, state, sentAt)
- `request_offers`: requestId

## Status Flow

### Delivery Request Status

```
PENDING → PROPOSED → ACCEPTED → IN_DELIVERY → DELIVERED
    ↓
CANCELLED (only from PENDING/PROPOSED)
```

### Offer Status

```
SENT → ACCEPTED (only one driver)
  ↓
REJECTED/EXPIRED (all other drivers)
```

## Technical Notes

### GeoJSON Format

All location fields use GeoJSON Point format:

```json
{
  "type": "Point",
  "coordinates": [longitude, latitude]
}
```

**Important**: MongoDB expects coordinates as `[longitude, latitude]`, not `[latitude, longitude]`.

### Atomic Operations

The offer acceptance uses MongoDB's atomic `findOneAndUpdate` to prevent race conditions when multiple drivers try to accept the same request simultaneously.

### Background Matching

The matching process runs asynchronously after request creation to avoid blocking the HTTP response. Errors are logged but don't fail the request creation.

### TypeScript Considerations

The code uses `as any` type assertions in some places to work around Mongoose's strict TypeScript definitions for ObjectId queries and operations.

## Files Modified/Created

### Models

- ✅ `backend/src/models/DeliveryRequest.model.ts` (updated)
- ✅ `backend/src/models/RequestOffer.model.ts` (updated)
- ✅ `backend/src/types/index.ts` (updated with new types)

### Services

- ✅ `backend/src/services/matching.service.ts` (new)
- ✅ `backend/src/services/request.service.ts` (new)
- ✅ `backend/src/services/offer.service.ts` (new)

### Controllers

- ✅ `backend/src/controllers/request.controller.ts` (new)
- ✅ `backend/src/controllers/offer.controller.ts` (new)

### Routes

- ✅ `backend/src/router/request.routes.ts` (new)
- ✅ `backend/src/router/offer.routes.ts` (new)
- ✅ `backend/src/router/index.ts` (updated)

### Verification

- ✅ `backend/verify-delivery-flow.js` (new)

## API Testing Examples

### Using cURL

**Create Delivery Request:**

```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Authorization: Bearer YOUR_RESTAURANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "RESTAURANT_ID",
    "pickupLocation": {
      "type": "Point",
      "coordinates": [-73.935242, 40.730610]
    },
    "pickupAddressText": "123 Main St, NYC",
    "dropoffLocation": {
      "type": "Point",
      "coordinates": [-73.940000, 40.735000]
    },
    "dropoffAddressText": "456 Customer Ave, NYC",
    "deliveryFee": 15.50,
    "notes": "Ring doorbell"
  }'
```

**Update Driver Location:**

```bash
curl -X PATCH http://localhost:3000/api/driver/location \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "type": "Point",
      "coordinates": [-73.935000, 40.730500]
    }
  }'
```

**Get Driver Inbox:**

```bash
curl http://localhost:3000/api/offers/inbox?state=SENT \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN"
```

**Accept Offer:**

```bash
curl -X POST http://localhost:3000/api/offers/OFFER_ID/accept \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN"
```

## Future Enhancements

Potential improvements to consider:

1. **Real-time Notifications**: Use WebSockets or SSE for instant offer notifications
2. **Distance Calculation**: Add actual distance (not just radius) to offers
3. **Driver Ratings**: Track and display driver ratings
4. **Estimated Time**: Calculate and show ETA for deliveries
5. **Push Notifications**: Mobile push notifications for offers
6. **Analytics**: Track acceptance rates, delivery times, etc.
7. **Auto-Retry**: Automatically retry matching if initial attempts fail
8. **Batch Matching**: Match multiple requests at once for efficiency
9. **Priority System**: Prioritize based on delivery fee or wait time
10. **Route Optimization**: Consider driver's current route when matching

## Troubleshooting

### No Drivers Found

- Ensure drivers have `isAvailable: true`
- Ensure drivers have `isVerified: true`
- Ensure drivers have `currentLocation` set
- Check if drivers are within 10km radius
- Verify 2dsphere indexes are created

### Offer Acceptance Fails

- Check for race conditions (multiple drivers accepting simultaneously)
- Verify request status is PENDING or PROPOSED
- Ensure `assignedDriverId` is not already set
- Check offer hasn't expired

### TypeScript Errors

- Run `npm install` to ensure all dependencies are installed
- Check that mongoose version matches package.json
- Use `as any` for problematic ObjectId type assertions

## License

This implementation is part of the Wakef Alik project.
