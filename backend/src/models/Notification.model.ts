import { Schema, model, Document } from 'mongoose';

export interface INotification extends Document {
    userId: Schema.Types.ObjectId;
    type: 'DELIVERY_OFFER' | 'DELIVERY_ASSIGNED' | 'DELIVERY_STATUS' | 'SYSTEM' | 'OTHER';
    relatedRequestId?: Schema.Types.ObjectId;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        type: {
            type: String,
            enum: ['DELIVERY_OFFER', 'DELIVERY_ASSIGNED', 'DELIVERY_STATUS', 'SYSTEM', 'OTHER'],
            required: [true, 'Notification type is required'],
        },
        relatedRequestId: {
            type: Schema.Types.ObjectId,
            ref: 'DeliveryRequest',
            required: false,
        },
        title: {
            type: String,
            required: [true, 'Notification title is required'],
            trim: true,
        },
        message: {
            type: String,
            required: [true, 'Notification message is required'],
            trim: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false, // We only need createdAt, which we manage manually
    }
);

// Indexes for efficient queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ relatedRequestId: 1 });

export const Notification = model<INotification>('Notification', NotificationSchema);
