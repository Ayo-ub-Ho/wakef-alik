import { Schema, model, Document } from 'mongoose';

export interface IRefreshToken extends Document {
    userId: Schema.Types.ObjectId;
    tokenHash: string;
    expiresAt: Date;
    revokedAt?: Date;
    createdAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        tokenHash: {
            type: String,
            required: [true, 'Token hash is required'],
            unique: true,
        },
        expiresAt: {
            type: Date,
            required: [true, 'Expiration date is required'],
        },
        revokedAt: {
            type: Date,
            required: false,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false, // We manage createdAt manually
    }
);

// Indexes for efficient token validation and cleanup
RefreshTokenSchema.index({ tokenHash: 1 });
RefreshTokenSchema.index({ userId: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }); // For TTL and cleanup
RefreshTokenSchema.index({ userId: 1, revokedAt: 1 }); // For finding active tokens

// TTL index to automatically remove expired tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
