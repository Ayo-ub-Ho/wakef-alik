import { Schema, model, Document } from 'mongoose';
import { GeoPointSchema } from './geoPoint.schema';
import { IGeoPoint } from '../types';



export interface IDeliveryRequest extends Document {
    restaurantId: Schema.Types.ObjectId;
    createdByUserId: Schema.Types.ObjectId;
    pickupLocation: IGeoPoint;
    pickupAddressText: string;
    dropoffLocation: IGeoPoint;
    dropoffAddressText: string;
    notes?: string;
    deliveryFee: number;
    status: 'PENDING' | 'OFFERED' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
    assignedDriverId?: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const DeliveryRequestSchema = new Schema<IDeliveryRequest>(
    {
        restaurantId: {
            type: Schema.Types.ObjectId,
            ref: 'RestaurantProfile',
            required: [true, 'Restaurant ID is required'],
        },
        createdByUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Created by user ID is required'],
        },
        pickupLocation: {
            type: GeoPointSchema,
            required: [true, 'Pickup location is required'],
        },
        pickupAddressText: {
            type: String,
            required: [true, 'Pickup address is required'],
            trim: true,
        },
        dropoffLocation: {
            type: GeoPointSchema,
            required: [true, 'Dropoff location is required'],
        },
        dropoffAddressText: {
            type: String,
            required: [true, 'Dropoff address is required'],
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
        },
        deliveryFee: {
            type: Number,
            required: [true, 'Delivery fee is required'],
            min: [0, 'Delivery fee cannot be negative'],
        },
        status: {
            type: String,
            enum: ['PENDING', 'OFFERED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
            default: 'PENDING',
        },
        assignedDriverId: {
            type: Schema.Types.ObjectId,
            ref: 'DriverProfile',
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
DeliveryRequestSchema.index({ restaurantId: 1 });
DeliveryRequestSchema.index({ createdByUserId: 1 });
DeliveryRequestSchema.index({ assignedDriverId: 1 });
DeliveryRequestSchema.index({ status: 1 });
DeliveryRequestSchema.index({ createdAt: -1 });
DeliveryRequestSchema.index({ pickupLocation: '2dsphere' });
DeliveryRequestSchema.index({ dropoffLocation: '2dsphere' });

export const DeliveryRequest = model<IDeliveryRequest>('DeliveryRequest', DeliveryRequestSchema);
