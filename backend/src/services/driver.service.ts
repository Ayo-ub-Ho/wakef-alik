import { DriverProfile, IDriverProfile } from '../models/DriverProfile.model';
import { User } from '../models/User.model';
import { Types } from 'mongoose';

export interface CreateDriverProfileInput {
    userId: string;
    vehicleType: 'BIKE' | 'MOTORCYCLE' | 'CAR' | 'VAN';
    hasDeliveryBox?: boolean;
}

export interface UpdateDriverProfileInput {
    vehicleType?: 'BIKE' | 'MOTORCYCLE' | 'CAR' | 'VAN';
    hasDeliveryBox?: boolean;
    isAvailable?: boolean;
    currentLocation?: {
        type: 'Point';
        coordinates: [number, number];
    };
}

/**
 * Create a driver profile
 */
export const createDriverProfile = async (
    input: CreateDriverProfileInput
): Promise<IDriverProfile> => {
    const { userId, vehicleType, hasDeliveryBox } = input;

    // Verify user exists and has DRIVER role
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    if (user.role !== 'DRIVER') {
        throw new Error('User role must be DRIVER to create a driver profile');
    }

    // Check if profile already exists
    const existingProfile = await DriverProfile.findOne({ userId: new Types.ObjectId(userId) as any });

    if (existingProfile) {
        throw new Error('Driver profile already exists for this user');
    }

    // Create profile
    const profile = await DriverProfile.create({
        userId: new Types.ObjectId(userId) as any,
        vehicleType,
        hasDeliveryBox: hasDeliveryBox ?? false,
        isAvailable: false,
        isVerified: false,
    });

    return profile;
};

/**
 * Get driver profile by user ID
 */
export const getDriverProfile = async (userId: string): Promise<IDriverProfile | null> => {
    return await DriverProfile.findOne({ userId: new Types.ObjectId(userId) as any }).populate('userId', 'fullName email phone');
};

/**
 * Update driver profile
 */
export const updateDriverProfile = async (
    userId: string,
    updates: UpdateDriverProfileInput
): Promise<IDriverProfile | null> => {
    const profile = await DriverProfile.findOneAndUpdate(
        { userId: new Types.ObjectId(userId) as any },
        { $set: updates },
        { new: true, runValidators: true }
    ) as unknown as IDriverProfile | null;

    if (!profile) {
        throw new Error('Driver profile not found');
    }

    return profile;
};

/**
 * Get all available drivers
 */
export const getAvailableDrivers = async (): Promise<IDriverProfile[]> => {
    return await DriverProfile.find({
        isAvailable: true,
        isVerified: true,
    }).populate('userId', 'fullName phone');
};
