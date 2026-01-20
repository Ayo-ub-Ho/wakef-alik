import { Schema, model, Document } from 'mongoose';

export interface IRequestOffer extends Document {
    requestId: Schema.Types.ObjectId;
    driverId: Schema.Types.ObjectId;
    state: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
    sentAt: Date;
    respondedAt?: Date;
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
            enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
            default: 'PENDING',
        },
        sentAt: {
            type: Date,
            default: Date.now,
        },
        respondedAt: {
            type: Date,
            required: false,
        },
    },
    {
        timestamps: false, // We manage sentAt and respondedAt manually
    }
);

// Indexes for efficient queries
RequestOfferSchema.index({ requestId: 1 });
RequestOfferSchema.index({ driverId: 1 });
RequestOfferSchema.index({ state: 1 });
RequestOfferSchema.index({ sentAt: -1 });
// Composite index for unique offers per driver per request
RequestOfferSchema.index({ requestId: 1, driverId: 1 }, { unique: true });

export const RequestOffer = model<IRequestOffer>('RequestOffer', RequestOfferSchema);
