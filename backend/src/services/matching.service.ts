import { Schema, Types } from 'mongoose';
import { DriverProfile, DeliveryRequest, RequestOffer, RestaurantProfile } from '../models';
import { IGeoPoint } from '../types';

export interface NearbyDeliveryRequest {
    _id: Schema.Types.ObjectId;
    distance: number;
    restaurantId: Schema.Types.ObjectId;
    restaurantName: string;
    pickupLocation: IGeoPoint;
    pickupAddressText: string;
    dropoffLocation: IGeoPoint;
    dropoffAddressText: string;
    deliveryFee: number;
    status: string;
    createdAt: Date;
}

interface NearbyDriver {
    _id: Schema.Types.ObjectId;
    distance: number;
}

/**
 * Find available and verified drivers near a location
 * @param location GeoJSON Point
 * @param radiusMeters Search radius in meters
 * @param limit Maximum number of drivers to return
 * @returns Array of driver IDs with distances
 */
export const findNearbyDrivers = async (
    location: IGeoPoint,
    radiusMeters: number,
    limit: number = 10
): Promise<NearbyDriver[]> => {
    const drivers = await DriverProfile.aggregate([
        {
            $geoNear: {
                near: location,
                distanceField: 'distance',
                maxDistance: radiusMeters,
                spherical: true,
                query: {
                    isAvailable: true,
                    isVerified: true,
                    currentLocation: { $exists: true },
                },
            },
        },
        {
            $limit: limit,
        },
        {
            $project: {
                _id: 1,
                distance: 1,
            },
        },
    ]);

    return drivers;
};

/**
 * Propose delivery request to nearby drivers with radius expansion
 * Starts with 2km, then 5km, then 10km (max 3 tries)
 * Creates RequestOffer for each found driver
 * Updates request status to PROPOSED if at least one offer is created
 * 
 * @param requestId The delivery request ID
 * @returns Number of offers created
 */
export const proposeToNearbyDrivers = async (
    requestId: Schema.Types.ObjectId | string
): Promise<{ offersCreated: number; radius: number }> => {
    // Get the delivery request
    const request = await DeliveryRequest.findById(requestId);
    if (!request) {
        throw new Error('Delivery request not found');
    }

    if (request.status !== 'PENDING') {
        throw new Error(`Cannot propose request with status ${request.status}`);
    }

    const radii = [2000, 5000, 10000]; // meters
    const expirationMinutes = 2;

    for (const radius of radii) {
        // Find nearby drivers
        const nearbyDrivers = await findNearbyDrivers(request.pickupLocation, radius, 20);

        if (nearbyDrivers.length === 0) {
            continue; // Try next radius
        }

        // Create offers for drivers who don't already have an offer for this request
        const now = new Date();
        const expiresAt = new Date(now.getTime() + expirationMinutes * 60 * 1000);

        let offersCreated = 0;

        for (const driver of nearbyDrivers) {
            try {
                // Try to create offer (unique index will prevent duplicates)
                await RequestOffer.create({
                    requestId: request._id as any,
                    driverId: driver._id as any,
                    state: 'SENT',
                    sentAt: now,
                    expiresAt,
                });
                offersCreated++;
            } catch (error: any) {
                // Ignore duplicate key errors (offer already exists)
                if (error.code !== 11000) {
                    console.error(`Error creating offer for driver ${driver._id}:`, error);
                }
            }
        }

        // If we created at least one offer, update request status and stop
        if (offersCreated > 0) {
            await DeliveryRequest.findByIdAndUpdate(requestId, {
                status: 'PROPOSED',
            });

            return { offersCreated, radius };
        }
    }

    // No drivers found after all tries
    return { offersCreated: 0, radius: radii[radii.length - 1] };
};

/**
 * Accept a delivery request offer (with atomic locking)
 * Only one driver can successfully accept
 * 
 * @param offerId The offer ID
 * @param driverId The driver ID accepting
 * @returns Success status and message
 */
export const acceptOffer = async (
    offerId: Schema.Types.ObjectId | string,
    driverId: Schema.Types.ObjectId | string
): Promise<{ success: boolean; message: string; request?: any }> => {
    // Get the offer
    const offer = await RequestOffer.findById(offerId);
    if (!offer) {
        return { success: false, message: 'Offer not found' };
    }

    // Check if offer belongs to driver
    if (offer.driverId.toString() !== driverId.toString()) {
        return { success: false, message: 'Offer does not belong to you' };
    }

    // Check if offer is in SENT state
    if (offer.state !== 'SENT') {
        return { success: false, message: `Offer is already ${offer.state}` };
    }

    // Check if offer has expired
    if (offer.expiresAt && offer.expiresAt < new Date()) {
        await RequestOffer.findByIdAndUpdate(offerId, {
            state: 'EXPIRED',
            respondedAt: new Date(),
        });
        return { success: false, message: 'Offer has expired' };
    }

    // Try to atomically assign the request to this driver
    const now = new Date();
    const updatedRequest = await DeliveryRequest.findOneAndUpdate(
        {
            _id: offer.requestId,
            status: { $in: ['PENDING', 'PROPOSED'] },
            assignedDriverId: { $exists: false },
        },
        {
            assignedDriverId: driverId,
            assignedAt: now,
            status: 'ACCEPTED',
        },
        { new: true }
    );

    if (!updatedRequest) {
        // Request was already assigned or status changed
        await RequestOffer.findByIdAndUpdate(offerId, {
            state: 'EXPIRED',
            respondedAt: now,
        });
        return { success: false, message: 'Request is no longer available' };
    }

    // Mark this offer as accepted
    await RequestOffer.findByIdAndUpdate(offerId, {
        state: 'ACCEPTED',
        respondedAt: now,
    });

    // Mark all other offers for this request as expired
    await RequestOffer.updateMany(
        {
            requestId: offer.requestId,
            _id: { $ne: offerId as any },
            state: 'SENT',
        },
        {
            state: 'EXPIRED',
            respondedAt: now,
        }
    );

    return {
        success: true,
        message: 'Offer accepted successfully',
        request: updatedRequest,
    };
};

/**
 * Reject a delivery request offer
 * 
 * @param offerId The offer ID
 * @param driverId The driver ID rejecting
 * @returns Success status and message
 */
export const rejectOffer = async (
    offerId: Schema.Types.ObjectId | string,
    driverId: Schema.Types.ObjectId | string
): Promise<{ success: boolean; message: string }> => {
    // Get the offer
    const offer = await RequestOffer.findById(offerId);
    if (!offer) {
        return { success: false, message: 'Offer not found' };
    }

    // Check if offer belongs to driver
    if (offer.driverId.toString() !== driverId.toString()) {
        return { success: false, message: 'Offer does not belong to you' };
    }

    // Check if offer is in SENT state
    if (offer.state !== 'SENT') {
        return { success: false, message: `Offer is already ${offer.state}` };
    }

    // Mark offer as rejected
    await RequestOffer.findByIdAndUpdate(offerId, {
        state: 'REJECTED',
        respondedAt: new Date(),
    });

    return { success: true, message: 'Offer rejected successfully' };
};

/**
 * Find nearby active delivery requests for drivers
 * Returns delivery requests from restaurants within the specified radius
 * 
 * @param location Driver's current GeoJSON Point location
 * @param radiusMeters Search radius in meters (default: 5000 = 5km)
 * @param limit Maximum number of requests to return (default: 20)
 * @returns Array of nearby delivery requests with restaurant info
 */
export const findNearbyDeliveryRequests = async (
    location: IGeoPoint,
    radiusMeters: number = 5000,
    limit: number = 20
): Promise<NearbyDeliveryRequest[]> => {
    const requests = await DeliveryRequest.aggregate([
        {
            $geoNear: {
                near: location,
                distanceField: 'distance',
                maxDistance: radiusMeters,
                spherical: true,
                query: {
                    status: { $in: ['PENDING', 'PROPOSED'] },
                    assignedDriverId: { $exists: false },
                },
            },
        },
        {
            $lookup: {
                from: 'restaurantprofiles',
                localField: 'restaurantId',
                foreignField: '_id',
                as: 'restaurant',
            },
        },
        {
            $unwind: '$restaurant',
        },
        {
            $match: {
                'restaurant.isVerified': true,
            },
        },
        {
            $limit: limit,
        },
        {
            $project: {
                _id: 1,
                distance: 1,
                restaurantId: 1,
                restaurantName: '$restaurant.restaurantName',
                pickupLocation: 1,
                pickupAddressText: 1,
                dropoffLocation: 1,
                dropoffAddressText: 1,
                deliveryFee: 1,
                status: 1,
                createdAt: 1,
            },
        },
    ]);

    return requests;
};
