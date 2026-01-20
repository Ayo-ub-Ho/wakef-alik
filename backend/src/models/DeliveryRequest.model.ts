import { Schema, model, Document } from 'mongoose';
import { GeoPointSchema } from './geoPoint.schema';
import { IGeoPoint } from '../types';



export type DeliveryStatus = 
    | 'PENDING' 
    | 'PROPOSED' 
    | 'ACCEPTED' 
    | 'IN_DELIVERY' 
    | 'DELIVERED' 
    | 'CANCELLED';

export interface IDeliveryRequest extends Document {
    restaurantId: Schema.Types.ObjectId;
    createdByUserId: Schema.Types.ObjectId;
    pickupLocation: IGeoPoint;
    pickupAddressText: string;
    dropoffLocation: IGeoPoint;
    dropoffAddressText: string;
    notes?: string;
    deliveryFee: number;
    status: DeliveryStatus;
    assignedDriverId?: Schema.Types.ObjectId;
    assignedAt?: Date;
    cancelledAt?: Date;
    deliveredAt?: Date;
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
            enum: ['PENDING', 'PROPOSED', 'ACCEPTED', 'IN_DELIVERY', 'DELIVERED', 'CANCELLED'],
            default: 'PENDING',
        },
        assignedDriverId: {
            type: Schema.Types.ObjectId,
            ref: 'DriverProfile',
        },
        assignedAt: {
            type: Date,
        },
        cancelledAt: {
            type: Date,
        },
        deliveredAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
DeliveryRequestSchema.index({ pickupLocation: '2dsphere' });
DeliveryRequestSchema.index({ restaurantId: 1, createdAt: -1 });
DeliveryRequestSchema.index({ status: 1, createdAt: -1 });
DeliveryRequestSchema.index({ assignedDriverId: 1 });

export const DeliveryRequest = model<IDeliveryRequest>('DeliveryRequest', DeliveryRequestSchema);
