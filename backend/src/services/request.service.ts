import { Schema, Types } from 'mongoose';
import { DeliveryRequest, RestaurantProfile } from '../models';
import { IGeoPoint, DeliveryStatus } from '../types';
import { proposeToNearbyDrivers } from './matching.service';

interface CreateRequestData {
    restaurantId: Schema.Types.ObjectId | string;
    userId: Schema.Types.ObjectId | string;
    pickupLocation: IGeoPoint;
    pickupAddressText: string;
    dropoffLocation: IGeoPoint;
    dropoffAddressText: string;
    deliveryFee: number;
    notes?: string;
}

/**
 * Create a new delivery request and trigger matching
 */
export const createDeliveryRequest = async (data: CreateRequestData) => {
    // Verify restaurant exists and belongs to user
    const restaurant = await RestaurantProfile.findOne({
        _id: data.restaurantId as any,
        userId: data.userId as any,
    });

    if (!restaurant) {
        throw new Error('Restaurant not found or does not belong to you');
    }

    // Create the delivery request
    const request = await DeliveryRequest.create({
        restaurantId: data.restaurantId as any,
        createdByUserId: data.userId as any,
        pickupLocation: data.pickupLocation,
        pickupAddressText: data.pickupAddressText,
        dropoffLocation: data.dropoffLocation,
        dropoffAddressText: data.dropoffAddressText,
        deliveryFee: data.deliveryFee,
        notes: data.notes,
        status: 'PENDING',
    }) as any;

    // Trigger matching in background (don't wait)
    proposeToNearbyDrivers(request._id).catch((error) => {
        console.error(`Error proposing request ${request._id}:`, error);
    });

    return request;
};

/**
 * Get all requests for a restaurant
 */
export const getRestaurantRequests = async (
    userId: Schema.Types.ObjectId | string,
    restaurantId?: Schema.Types.ObjectId | string
) => {
    // If restaurantId provided, verify ownership
    if (restaurantId) {
        const restaurant = await RestaurantProfile.findOne({
            _id: restaurantId as any,
            userId: userId as any,
        });

        if (!restaurant) {
            throw new Error('Restaurant not found or does not belong to you');
        }

        return DeliveryRequest.find({ restaurantId: restaurantId as any })
            .populate('restaurantId', 'restaurantName')
            .populate('assignedDriverId', 'vehicleType')
            .sort({ createdAt: -1 });
    }

    // Get all restaurants for this user
    const restaurants = await RestaurantProfile.find({ userId: userId as any });
    const restaurantIds = restaurants.map((r) => r._id);

    return DeliveryRequest.find({ restaurantId: { $in: restaurantIds as any } })
        .populate('restaurantId', 'restaurantName')
        .populate('assignedDriverId', 'vehicleType')
        .sort({ createdAt: -1 });
};

/**
 * Get a specific request by ID
 */
export const getRequestById = async (
    requestId: Schema.Types.ObjectId | string,
    userId: Schema.Types.ObjectId | string
) => {
    const request = await DeliveryRequest.findById(requestId)
        .populate('restaurantId', 'restaurantName ownerName addressText')
        .populate('assignedDriverId', 'vehicleType hasDeliveryBox');

    if (!request) {
        throw new Error('Request not found');
    }

    // Verify ownership
    if (request.createdByUserId.toString() !== userId.toString()) {
        throw new Error('You do not have permission to view this request');
    }

    return request;
};

/**
 * Cancel a delivery request
 */
export const cancelRequest = async (
    requestId: Schema.Types.ObjectId | string,
    userId: Schema.Types.ObjectId | string
) => {
    const request = await DeliveryRequest.findById(requestId);

    if (!request) {
        throw new Error('Request not found');
    }

    // Verify ownership
    if (request.createdByUserId.toString() !== userId.toString()) {
        throw new Error('You do not have permission to cancel this request');
    }

    // Check if request can be cancelled
    if (!['PENDING', 'PROPOSED'].includes(request.status)) {
        throw new Error(`Cannot cancel request with status ${request.status}`);
    }

    // Update request
    request.status = 'CANCELLED';
    request.cancelledAt = new Date();
    await request.save();

    return request;
};

/**
 * Update request status (for driver)
 */
export const updateRequestStatus = async (
    requestId: Schema.Types.ObjectId | string,
    driverId: Schema.Types.ObjectId | string,
    newStatus: DeliveryStatus
) => {
    const request = await DeliveryRequest.findById(requestId);

    if (!request) {
        throw new Error('Request not found');
    }

    // Verify driver is assigned to this request
    if (!request.assignedDriverId || request.assignedDriverId.toString() !== driverId.toString()) {
        throw new Error('You are not assigned to this request');
    }

    // Validate status transition
    const allowedStatuses: DeliveryStatus[] = ['IN_DELIVERY', 'DELIVERED'];
    if (!allowedStatuses.includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}`);
    }

    if (newStatus === 'DELIVERED' && request.status !== 'IN_DELIVERY') {
        throw new Error('Request must be in IN_DELIVERY status before marking as DELIVERED');
    }

    // Update request
    request.status = newStatus;
    if (newStatus === 'DELIVERED') {
        request.deliveredAt = new Date();
    }
    await request.save();

    return request;
};
