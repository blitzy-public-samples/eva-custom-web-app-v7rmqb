/**
 * @fileoverview Authentication request validation schemas and functions
 * Implements comprehensive security-focused validation for auth operations
 * Version: 1.0.0
 */

import Joi from 'joi'; // Version: 17.9.0
import { CreateUserDTO } from '../../types/user.types';

// Security constants for validation rules
const PASSWORD_MIN_LENGTH = 12;
const MAX_FIELD_LENGTH = 255;
const PASSWORD_PATTERN = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{12,}$';
const CANADIAN_PROVINCES = ["AB", "BC", "MB", "NB", "NL", "NS", "ON", "PE", "QC", "SK", "NT", "NU", "YT"];

// Common validation rules with enhanced security
const emailSchema = Joi.string()
    .email({ 
        minDomainSegments: 2,
        tlds: { allow: true }
    })
    .max(MAX_FIELD_LENGTH)
    .lowercase()
    .trim()
    .required()
    .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': `Email cannot exceed ${MAX_FIELD_LENGTH} characters`,
        'any.required': 'Email is required'
    });

const passwordSchema = Joi.string()
    .min(PASSWORD_MIN_LENGTH)
    .max(MAX_FIELD_LENGTH)
    .pattern(new RegExp(PASSWORD_PATTERN))
    .required()
    .messages({
        'string.min': `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
    });

/**
 * Enhanced schema for login request validation
 * Implements strict email format checking and password requirements
 */
export const loginSchema = Joi.object({
    email: emailSchema,
    password: passwordSchema
}).required();

/**
 * Comprehensive schema for user registration validation
 * Implements PIPEDA-compliant validation rules
 */
export const registrationSchema = Joi.object<CreateUserDTO>({
    email: emailSchema,
    name: Joi.string()
        .min(2)
        .max(MAX_FIELD_LENGTH)
        .pattern(/^[a-zA-Z\s-']+$/)
        .required()
        .messages({
            'string.min': 'Name must be at least 2 characters',
            'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes',
            'any.required': 'Name is required'
        }),
    province: Joi.string()
        .valid(...CANADIAN_PROVINCES)
        .required()
        .messages({
            'any.only': 'Please select a valid Canadian province',
            'any.required': 'Province is required'
        }),
    password: passwordSchema
}).required();

/**
 * Schema for token refresh request validation
 * Implements secure token format validation
 */
export const tokenSchema = Joi.object({
    refreshToken: Joi.string()
        .min(10)
        .max(1000)
        .required()
        .messages({
            'string.min': 'Invalid refresh token format',
            'string.max': 'Invalid refresh token format',
            'any.required': 'Refresh token is required'
        })
}).required();

/**
 * Validates login request payload with enhanced security checks
 * @param payload - The login request payload to validate
 * @throws ValidationError with detailed message if validation fails
 */
export const validateLoginRequest = async (payload: unknown): Promise<void> => {
    try {
        await loginSchema.validateAsync(payload, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Login validation failed: ${error.message}`);
        }
        throw error;
    }
};

/**
 * Validates registration request payload with comprehensive security checks
 * Implements PIPEDA-compliant validation rules
 * @param payload - The registration request payload to validate
 * @throws ValidationError with detailed message if validation fails
 */
export const validateRegistrationRequest = async (payload: unknown): Promise<void> => {
    try {
        await registrationSchema.validateAsync(payload, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Registration validation failed: ${error.message}`);
        }
        throw error;
    }
};

/**
 * Validates token refresh request payload
 * @param payload - The token refresh request payload to validate
 * @throws ValidationError with detailed message if validation fails
 */
export const validateTokenRequest = async (payload: unknown): Promise<void> => {
    try {
        await tokenSchema.validateAsync(payload, {
            abortEarly: false,
            stripUnknown: true
        });
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Token validation failed: ${error.message}`);
        }
        throw error;
    }
};