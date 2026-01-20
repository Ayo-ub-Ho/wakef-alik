import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain text password with a hashed password
 */
export const comparePassword = async (
    password: string,
    hashedPassword: string
): Promise<boolean> => {
    return await bcrypt.compare(password, hashedPassword);
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): { isValid: boolean; message?: string } => {
    if (password.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    // Add more validation rules as needed
    // Example: Check for uppercase, lowercase, numbers, special characters

    return { isValid: true };
};
