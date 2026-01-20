import { Schema, model, Document } from 'mongoose';
import { GeoPointSchema } from './geoPoint.schema';
import { IGeoPoint } from '../types';

export interface IRestaurantProfile extends Document {
    userId: Schema.Types.ObjectId;
    restaurantName: string;
    ownerName: string;
    addressText: string;
    location: IGeoPoint;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const RestaurantProfileSchema = new Schema<IRestaurantProfile>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            unique: true,
        },
        restaurantName: {
            type: String,
            required: [true, 'Restaurant name is required'],
            trim: true,
        },
        ownerName: {
            type: String,
            required: [true, 'Owner name is required'],
            trim: true,
        },
        addressText: {
            type: String,
            required: [true, 'Address is required'],
            trim: true,
        },
        location: {
            type: GeoPointSchema,
            required: [true, 'Location coordinates are required'],
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for geospatial queries and user lookup
RestaurantProfileSchema.index({ location: '2dsphere' });
RestaurantProfileSchema.index({ userId: 1 });
RestaurantProfileSchema.index({ isVerified: 1 });

export const RestaurantProfile = model<IRestaurantProfile>('RestaurantProfile', RestaurantProfileSchema);
