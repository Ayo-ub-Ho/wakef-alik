import { Schema, model, Document } from 'mongoose';
import { GeoPointSchema } from './geoPoint.schema';
import { IGeoPoint } from '../types';

export interface IDriverProfile extends Document {
    userId: Schema.Types.ObjectId;
    vehicleType: string;
    hasDeliveryBox: boolean;
    isAvailable: boolean;
    isVerified: boolean;
    currentLocation?: IGeoPoint;
    createdAt: Date;
    updatedAt: Date;
}

const DriverProfileSchema = new Schema<IDriverProfile>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            unique: true,
        },
        vehicleType: {
            type: String,
            required: [true, 'Vehicle type is required'],
            enum: ['BIKE', 'MOTORCYCLE', 'CAR', 'VAN'],
            trim: true,
        },
        hasDeliveryBox: {
            type: Boolean,
            default: false,
        },
        isAvailable: {
            type: Boolean,
            default: false,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        currentLocation: {
            type: GeoPointSchema,
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for geospatial queries and filtering
DriverProfileSchema.index({ currentLocation: '2dsphere' });
DriverProfileSchema.index({ userId: 1 });
DriverProfileSchema.index({ isAvailable: 1, isVerified: 1 });

export const DriverProfile = model<IDriverProfile>('DriverProfile', DriverProfileSchema);
