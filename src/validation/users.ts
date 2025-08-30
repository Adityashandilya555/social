import { body, query } from 'express-validator';
import { 
  validateObjectId, 
  validateEmail,
  validateImageUrl
} from '../middleware/validation';

export const validateCreateUser = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  validateEmail('email'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('major')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Major must be between 2 and 100 characters'),
  
  validateImageUrl('profilePictureUrl', true),
  
  body('graduationYear')
    .optional()
    .isInt({ min: 2020, max: 2050 })
    .withMessage('Graduation year must be between 2020 and 2050')
    .toInt(),
  
  body('interests')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Maximum 20 interests allowed'),
  
  body('interests.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Each interest must be between 2 and 50 characters'),
  
  body('isPublicProfile')
    .optional()
    .isBoolean()
    .withMessage('isPublicProfile must be a boolean')
    .toBoolean(),
  
  body('oneSignalPlayerId')
    .optional()
    .trim()
    .isLength({ min: 10, max: 100 })
    .withMessage('OneSignal Player ID must be between 10 and 100 characters'),
];

export const validateUpdateUser = [
  validateObjectId('id'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('major')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Major must be between 2 and 100 characters'),
  
  validateImageUrl('profilePictureUrl', true),
  
  body('graduationYear')
    .optional()
    .isInt({ min: 2020, max: 2050 })
    .withMessage('Graduation year must be between 2020 and 2050')
    .toInt(),
  
  body('interests')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Maximum 20 interests allowed'),
  
  body('interests.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Each interest must be between 2 and 50 characters'),
  
  body('isPublicProfile')
    .optional()
    .isBoolean()
    .withMessage('isPublicProfile must be a boolean')
    .toBoolean(),
  
  body('oneSignalPlayerId')
    .optional()
    .trim()
    .isLength({ min: 10, max: 100 })
    .withMessage('OneSignal Player ID must be between 10 and 100 characters'),
];

export const validateUpdateAvatar = [
  validateObjectId('id'),
  validateImageUrl('profilePictureUrl'),
];

export const validateGetUser = [
  validateObjectId('id'),
];

export const validateGetUserProfile = [
  validateObjectId('id'),
];

export const validateDeleteUser = [
  validateObjectId('id'),
];

export const validateUserSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
];