import { Schema, Types } from 'mongoose';
import { RequestOffer, DriverProfile, DeliveryRequest } from '../models';
import { IGeoPoint } from '../types';

/**
 * Update driver's current location
 */
export const updateDriverLocation = async (
    userId: Schema.Types.ObjectId | string,
    location: IGeoPoint
) => {
    const driver = await DriverProfile.findOne({ userId: userId as any });

    if (!driver) {
        throw new Error('Driver profile not found');
    }

    driver.currentLocation = location;
    await driver.save();

    return driver;
};

/**
 * Get driver's inbox of pending offers
 */
export const getDriverInbox = async (
    userId: Schema.Types.ObjectId | string,
    state?: string
) => {
    const driver = await DriverProfile.findOne({ userId: userId as any });

    if (!driver) {
        throw new Error('Driver profile not found');
    }

    const query: any = { driverId: driver._id };
    if (state) {
        query.state = state;
    }

    const offers = await RequestOffer.find(query)
        .populate({
            path: 'requestId',
            populate: {
                path: 'restaurantId',
                select: 'restaurantName addressText location',
            },
        })
        .sort({ sentAt: -1 });

    return offers;
};

/**
 * Get driver's assigned/active deliveries
 */
export const getDriverDeliveries = async (
    userId: Schema.Types.ObjectId | string
) => {
    const driver = await DriverProfile.findOne({ userId: userId as any });

    if (!driver) {
        throw new Error('Driver profile not found');
    }

    const deliveries = await DeliveryRequest.find({
        assignedDriverId: driver._id as any,
        status: { $in: ['ACCEPTED', 'IN_DELIVERY'] },
    })
        .populate('restaurantId', 'restaurantName addressText location')
        .sort({ assignedAt: -1 });

    return deliveries;
};
