import { body, param } from 'express-validator';
import { 
  validateObjectId, 
  validateRequiredObjectId,
  validateImageUrl
} from '../middleware/validation';

export const validateCreateClub = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Club name must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('category')
    .optional()
    .isIn(['academic', 'sports', 'arts', 'technology', 'volunteer', 'social', 'professional', 'other'])
    .withMessage('Category must be one of: academic, sports, arts, technology, volunteer, social, professional, other'),
  
  body('officers')
    .optional()
    .isArray()
    .withMessage('Officers must be an array'),
  
  body('officers.*')
    .optional()
    .custom((value) => {
      if (!value.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid officer ID format');
      }
      return true;
    }),
  
  body('members')
    .optional()
    .isArray()
    .withMessage('Members must be an array'),
  
  body('members.*')
    .optional()
    .custom((value) => {
      if (!value.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid member ID format');
      }
      return true;
    }),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
    .toBoolean(),
  
  body('maxMembers')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Max members must be between 1 and 10000')
    .toInt(),
  
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Each tag must be between 2 and 30 characters'),
  
  validateImageUrl('logoUrl', true),
  
  body('meetingSchedule')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Meeting schedule must be between 5 and 200 characters'),
  
  body('contactEmail')
    .optional()
    .normalizeEmail()
    .isEmail()
    .withMessage('Contact email must be a valid email address'),
];

export const validateJoinClub = [
  validateObjectId('id'),
  validateRequiredObjectId('userId'),
];

export const validateLeaveClub = [
  validateObjectId('id'),
  validateRequiredObjectId('userId'),
];

export const validateAddOfficer = [
  validateObjectId('id'),
  validateRequiredObjectId('userId'),
];

export const validateGetClub = [
  validateObjectId('id'),
];

export const validateGetClubMembers = [
  validateObjectId('id'),
];

export const validateGetClubOfficers = [
  validateObjectId('id'),
];

export const validateSearchClubs = [
  param('query')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
];