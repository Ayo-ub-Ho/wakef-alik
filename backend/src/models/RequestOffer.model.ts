import { Schema, model, Document } from 'mongoose';

export type OfferState = 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface IRequestOffer extends Document {
    requestId: Schema.Types.ObjectId;
    driverId: Schema.Types.ObjectId;
    state: OfferState;
    sentAt: Date;
    respondedAt?: Date;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const RequestOfferSchema = new Schema<IRequestOffer>(
    {
        requestId: {
            type: Schema.Types.ObjectId,
            ref: 'DeliveryRequest',
            required: [true, 'Request ID is required'],
        },
        driverId: {
            type: Schema.Types.ObjectId,
            ref: 'DriverProfile',
            required: [true, 'Driver ID is required'],
        },
        state: {
            type: String,
            enum: ['SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
            default: 'SENT',
        },
        sentAt: {
            type: Date,
            required: [true, 'Sent at timestamp is required'],
            default: Date.now,
        },
        respondedAt: {
            type: Date,
        },
        expiresAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Unique constraint to ensure one offer per request-driver pair
RequestOfferSchema.index({ requestId: 1, driverId: 1 }, { unique: true });
RequestOfferSchema.index({ driverId: 1, state: 1, sentAt: -1 });
RequestOfferSchema.index({ requestId: 1 });

export const RequestOffer = model<IRequestOffer>('RequestOffer', RequestOfferSchema);
