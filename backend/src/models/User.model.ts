import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    fullName: string;
    email: string;
    phone: string;
    passwordHash: string;
    role: 'DRIVER' | 'RESTAURANT' | 'ADMIN';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            unique: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: [true, 'Password hash is required'],
            select: false, // Don't include password hash in query results by default
        },
        role: {
            type: String,
            enum: ['DRIVER', 'RESTAURANT', 'ADMIN'],
            required: [true, 'User role is required'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ role: 1 });

export const User = model<IUser>('User', UserSchema);
