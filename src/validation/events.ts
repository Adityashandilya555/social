import { body } from 'express-validator';
import { 
  validateObjectId, 
  validateRequiredObjectId, 
  validateDateTime, 
  validateDateTimeAfter, 
  validateImageUrl,
  validateArrayLength 
} from '../middleware/validation';

export const validateCreateEvent = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  validateDateTime('startTime'),
  validateDateTimeAfter('endTime', 'startTime'),
  
  body('location')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Location must be between 3 and 200 characters'),
  
  validateRequiredObjectId('host'),
  
  body('maxAttendees')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Max attendees must be between 1 and 10000')
    .toInt(),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
    .toBoolean(),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Each tag must be between 2 and 30 characters'),
  
  validateImageUrl('imageUrl', true),
  
  body('requiresApproval')
    .optional()
    .isBoolean()
    .withMessage('requiresApproval must be a boolean')
    .toBoolean(),
];

export const validateJoinEvent = [
  validateObjectId('id'),
  validateRequiredObjectId('userId'),
];

export const validateGetEvent = [
  validateObjectId('id'),
];

export const validateUpdateEvent = [
  validateObjectId('id'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  validateDateTime('startTime', true),
  
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('endTime must be a valid ISO 8601 datetime')
    .toDate()
    .custom((value, { req }) => {
      if (req.body.startTime) {
        const startTime = new Date(req.body.startTime);
        if (value <= startTime) {
          throw new Error('endTime must be after startTime');
        }
      }
      return true;
    }),
  
  body('location')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Location must be between 3 and 200 characters'),
  
  body('maxAttendees')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Max attendees must be between 1 and 10000')
    .toInt(),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
    .toBoolean(),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Each tag must be between 2 and 30 characters'),
  
  validateImageUrl('imageUrl', true),
  
  body('requiresApproval')
    .optional()
    .isBoolean()
    .withMessage('requiresApproval must be a boolean')
    .toBoolean(),
];