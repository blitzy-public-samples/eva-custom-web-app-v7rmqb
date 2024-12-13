// zod version: ^3.22.0
import { z } from 'zod';
// validator version: ^13.11.0
import validator from 'validator';
import { LoginPayload, RegisterPayload, Province } from '../types/auth.types';

/**
 * Interface for validation results with bilingual error messages
 */
interface ValidationResult {
  success: boolean;
  errors?: {
    en: string[];
    fr: string[];
  };
}

/**
 * Canadian area code ranges by province
 */
const CANADIAN_AREA_CODES: { [key: string]: number[] } = {
  ALBERTA: [403, 587, 780, 825],
  BRITISH_COLUMBIA: [236, 250, 604, 672, 778],
  ONTARIO: [226, 249, 289, 343, 365, 416, 437, 519, 548, 613, 647, 705, 807, 905]
};

/**
 * Password requirements schema with enhanced security rules
 */
const passwordSchema = z.string()
  .min(12, { message: 'Password must be at least 12 characters long' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' })
  .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' });

/**
 * Email validation schema with additional security checks
 */
const emailSchema = z.string()
  .email({ message: 'Invalid email format' })
  .refine((email) => {
    // Additional security checks for email
    return (
      !email.includes('..') && // No consecutive dots
      email.length <= 254 && // RFC 5321 length limit
      validator.isEmail(email, { 
        allow_utf8_local_part: false,
        require_tld: true
      })
    );
  }, { message: 'Invalid email format or security requirements not met' });

/**
 * Validates login payload against security requirements
 * @param payload - Login credentials payload
 * @returns Validation result with bilingual error messages
 */
export const validateLoginPayload = (payload: LoginPayload): ValidationResult => {
  try {
    emailSchema.parse(payload.email);
    passwordSchema.parse(payload.password);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: {
          en: error.errors.map(e => e.message),
          fr: error.errors.map(e => translateError(e.message)) // Implement translation
        }
      };
    }
    return { 
      success: false,
      errors: {
        en: ['Invalid login credentials'],
        fr: ['Identifiants de connexion invalides']
      }
    };
  }
};

/**
 * Validates registration payload with enhanced security checks
 * @param payload - Registration data payload
 * @returns Validation result with bilingual error messages
 */
export const validateRegisterPayload = (payload: RegisterPayload): ValidationResult => {
  try {
    emailSchema.parse(payload.email);
    passwordSchema.parse(payload.password);

    // Name validation
    const nameSchema = z.string()
      .min(2, { message: 'Name must be at least 2 characters long' })
      .max(100, { message: 'Name cannot exceed 100 characters' })
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: 'Name contains invalid characters' });
    
    nameSchema.parse(payload.name);

    // Province validation
    if (!Object.values(Province).includes(payload.province as Province)) {
      throw new Error('Invalid province selection');
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: {
          en: error.errors.map(e => e.message),
          fr: error.errors.map(e => translateError(e.message))
        }
      };
    }
    return {
      success: false,
      errors: {
        en: [(error as Error).message],
        fr: [translateError((error as Error).message)]
      }
    };
  }
};

/**
 * Validates Canadian phone numbers with area code verification
 * @param phoneNumber - Phone number to validate
 * @param province - Canadian province for area code validation
 * @returns Validation result with bilingual error messages
 */
export const validatePhoneNumber = (
  phoneNumber: string,
  province: Province
): ValidationResult => {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Basic format validation
  if (cleaned.length !== 10) {
    return {
      success: false,
      errors: {
        en: ['Phone number must be 10 digits'],
        fr: ['Le numéro de téléphone doit contenir 10 chiffres']
      }
    };
  }

  // Extract area code
  const areaCode = parseInt(cleaned.substring(0, 3));

  // Validate area code for province
  if (!CANADIAN_AREA_CODES[province]?.includes(areaCode)) {
    return {
      success: false,
      errors: {
        en: [`Invalid area code for ${province}`],
        fr: [`Indicatif régional invalide pour ${province}`]
      }
    };
  }

  // Validate exchange code (second set of 3 digits)
  const exchangeCode = parseInt(cleaned.substring(3, 6));
  if (exchangeCode < 200 || exchangeCode === 555) { // Invalid exchange codes
    return {
      success: false,
      errors: {
        en: ['Invalid exchange code'],
        fr: ['Code de central téléphonique invalide']
      }
    };
  }

  return { success: true };
};

/**
 * Validates Canadian postal codes with provincial verification
 * @param postalCode - Postal code to validate
 * @param province - Canadian province for postal code validation
 * @returns Validation result with bilingual error messages
 */
export const validatePostalCode = (
  postalCode: string,
  province: Province
): ValidationResult => {
  // Remove whitespace and convert to uppercase
  const cleaned = postalCode.replace(/\s/g, '').toUpperCase();

  // Basic format validation using Canadian postal code pattern
  const postalCodeRegex = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/;
  
  if (!postalCodeRegex.test(cleaned)) {
    return {
      success: false,
      errors: {
        en: ['Invalid postal code format'],
        fr: ['Format de code postal invalide']
      }
    };
  }

  // Validate first letter against province
  const firstLetter = cleaned.charAt(0);
  const provinceLetters: { [key: string]: string[] } = {
    ALBERTA: ['T'],
    BRITISH_COLUMBIA: ['V'],
    ONTARIO: ['K', 'L', 'M', 'N', 'P']
  };

  if (!provinceLetters[province]?.includes(firstLetter)) {
    return {
      success: false,
      errors: {
        en: [`Invalid postal code prefix for ${province}`],
        fr: [`Préfixe de code postal invalide pour ${province}`]
      }
    };
  }

  return { success: true };
};

/**
 * Translates error messages to French
 * @param message - English error message
 * @returns French translation of the error message
 */
const translateError = (message: string): string => {
  const translations: { [key: string]: string } = {
    'Invalid email format': 'Format de courriel invalide',
    'Password must be at least 12 characters long': 'Le mot de passe doit contenir au moins 12 caractères',
    'Password must contain at least one uppercase letter': 'Le mot de passe doit contenir au moins une lettre majuscule',
    'Password must contain at least one lowercase letter': 'Le mot de passe doit contenir au moins une lettre minuscule',
    'Password must contain at least one number': 'Le mot de passe doit contenir au moins un chiffre',
    'Password must contain at least one special character': 'Le mot de passe doit contenir au moins un caractère spécial',
    'Name must be at least 2 characters long': 'Le nom doit contenir au moins 2 caractères',
    'Name cannot exceed 100 characters': 'Le nom ne peut pas dépasser 100 caractères',
    'Name contains invalid characters': 'Le nom contient des caractères invalides',
    'Invalid province selection': 'Sélection de province invalide'
  };

  return translations[message] || message;
};