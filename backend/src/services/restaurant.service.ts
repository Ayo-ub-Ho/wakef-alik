import { RestaurantProfile, IRestaurantProfile } from '../models/RestaurantProfile.model';
import { User } from '../models/User.model';
import { Types } from 'mongoose';

export interface CreateRestaurantProfileInput {
    userId: string;
    restaurantName: string;
    ownerName: string;
    addressText: string;
    location: {
        type: 'Point';
        coordinates: [number, number];
    };
}

export interface UpdateRestaurantProfileInput {
    restaurantName?: string;
    ownerName?: string;
    addressText?: string;
    location?: {
        type: 'Point';
        coordinates: [number, number];
    };
}

/**
 * Create a restaurant profile
 */
export const createRestaurantProfile = async (
    input: CreateRestaurantProfileInput
): Promise<IRestaurantProfile> => {
    const { userId, restaurantName, ownerName, addressText, location } = input;

    // Verify user exists and has RESTAURANT role
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    if (user.role !== 'RESTAURANT') {
        throw new Error('User role must be RESTAURANT to create a restaurant profile');
    }

    // Check if profile already exists
    const existingProfile = await RestaurantProfile.findOne({ userId: new Types.ObjectId(userId) as any });

    if (existingProfile) {
        throw new Error('Restaurant profile already exists for this user');
    }

    // Create profile
    const profile = await RestaurantProfile.create({
        userId: new Types.ObjectId(userId) as any,
        restaurantName,
        ownerName,
        addressText,
        location: {
            type: 'Point',
            coordinates: location.coordinates,
        },
        isVerified: false,
    });

    return profile;
};

/**
 * Get restaurant profile by user ID
 */
export const getRestaurantProfile = async (
    userId: string
): Promise<IRestaurantProfile | null> => {
    return await RestaurantProfile.findOne({ userId: new Types.ObjectId(userId) as any }).populate(
        'userId',
        'fullName email phone'
    );
};

/**
 * Update restaurant profile
 */
export const updateRestaurantProfile = async (
    userId: string,
    updates: UpdateRestaurantProfileInput
): Promise<IRestaurantProfile | null> => {
    const profile = await RestaurantProfile.findOneAndUpdate(
        { userId: new Types.ObjectId(userId) as any },
        { $set: updates },
        { new: true, runValidators: true }
    ) as unknown as IRestaurantProfile | null;

    if (!profile) {
        throw new Error('Restaurant profile not found');
    }

    return profile;
};

/**
 * Get all verified restaurants
 */
export const getVerifiedRestaurants = async (): Promise<IRestaurantProfile[]> => {
    return await RestaurantProfile.find({
        isVerified: true,
    }).populate('userId', 'fullName phone');
};
