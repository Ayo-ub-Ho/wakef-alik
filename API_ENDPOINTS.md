# API Endpoints Summary - Wakef Alik Delivery System

## Authentication Required

All endpoints require JWT Bearer token in Authorization header:

```
Authorization: Bearer <token>
```

---

## Restaurant Endpoints (Role: RESTAURANT)

### POST /api/requests

Create a new delivery request

- **Auth**: Required (RESTAURANT)
- **Body**:

```json
{
  "restaurantId": "string",
  "pickupLocation": {
    "type": "Point",
    "coordinates": [lng, lat]
  },
  "pickupAddressText": "string",
  "dropoffLocation": {
    "type": "Point",
    "coordinates": [lng, lat]
  },
  "dropoffAddressText": "string",
  "deliveryFee": number,
  "notes": "string" (optional)
}
```

- **Response**: Created request with status PENDING/PROPOSED

### GET /api/requests/my

Get all my delivery requests

- **Auth**: Required (RESTAURANT)
- **Query Params**: `restaurantId` (optional)
- **Response**: Array of requests

### GET /api/requests/:id

Get specific request details

- **Auth**: Required (RESTAURANT)
- **Response**: Request with populated details

### PATCH /api/requests/:id/cancel

Cancel a delivery request

- **Auth**: Required (RESTAURANT)
- **Response**: Updated request with status CANCELLED

---

## Driver Endpoints (Role: DRIVER)

### PATCH /api/driver/location

Update current location

- **Auth**: Required (DRIVER)
- **Body**:

```json
{
  "location": {
    "type": "Point",
    "coordinates": [lng, lat]
  }
}
```

- **Response**: Updated location

### GET /api/offers/inbox

Get pending delivery offers

- **Auth**: Required (DRIVER)
- **Query Params**: `state` (optional: SENT, ACCEPTED, REJECTED, EXPIRED)
- **Response**: Array of offers with request details

### POST /api/offers/:offerId/accept

Accept a delivery offer

- **Auth**: Required (DRIVER)
- **Response**: Accepted request
- **Error**: 409 if already assigned to another driver

### POST /api/offers/:offerId/reject

Reject a delivery offer

- **Auth**: Required (DRIVER)
- **Response**: Success message

### PATCH /api/requests/:id/status

Update delivery status

- **Auth**: Required (DRIVER)
- **Body**:

```json
{
  "status": "IN_DELIVERY" | "DELIVERED"
}
```

- **Response**: Updated request

### GET /api/driver/deliveries

Get active deliveries

- **Auth**: Required (DRIVER)
- **Response**: Array of active requests

---

## Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (race condition on offer acceptance)

---

## Workflow Example

### Restaurant Creates Request

```
POST /api/requests
→ System finds nearby drivers
→ Creates offers for drivers
→ Status becomes PROPOSED
```

### Driver Receives Offer

```
GET /api/offers/inbox?state=SENT
→ Sees pending offers
→ Decides to accept
```

### Driver Accepts Offer

```
POST /api/offers/{offerId}/accept
→ Request assigned to driver
→ Other offers expire
→ Status becomes ACCEPTED
```

### Driver Delivers Order

```
PATCH /api/requests/{id}/status
Body: { "status": "IN_DELIVERY" }

PATCH /api/requests/{id}/status
Body: { "status": "DELIVERED" }
```

### Restaurant Checks Status

```
GET /api/requests/{id}
→ Sees DELIVERED status
→ Sees deliveredAt timestamp
```

---

## GeoJSON Format

**Important**: Coordinates are [longitude, latitude], not [latitude, longitude]

```json
{
  "type": "Point",
  "coordinates": [-73.935242, 40.73061]
}
```

- Longitude: -180 to 180
- Latitude: -90 to 90

---

## Matching Radii

1. First try: 2 km
2. Second try: 5 km
3. Third try: 10 km

System stops after finding at least one available driver.

---

## Offer Expiration

- Offers expire 2 minutes after being sent
- Expired offers cannot be accepted
- Status changes to EXPIRED

---

## Status Flow

### Request Status

```
PENDING → PROPOSED → ACCEPTED → IN_DELIVERY → DELIVERED
    ↓
CANCELLED (only from PENDING/PROPOSED)
```

### Offer Status

```
SENT → ACCEPTED/REJECTED/EXPIRED
```
