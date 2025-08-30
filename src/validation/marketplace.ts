import { body, query, param } from 'express-validator';
import { ListingCategory } from '../models';
import { 
  validateObjectId, 
  validateRequiredObjectId,
  validateArrayLength
} from '../middleware/validation';

export const validateCreateListing = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number')
    .toFloat(),
  
  validateRequiredObjectId('seller'),
  
  body('category')
    .isIn(Object.values(ListingCategory))
    .withMessage(`Category must be one of: ${Object.values(ListingCategory).join(', ')}`),
  
  body('condition')
    .optional()
    .isIn(['new', 'like-new', 'good', 'fair', 'poor'])
    .withMessage('Condition must be one of: new, like-new, good, fair, poor'),
  
  body('imageUrls')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 images allowed'),
  
  body('imageUrls.*')
    .optional()
    .matches(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i)
    .withMessage('Each image URL must be a valid image link'),
  
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Each tag must be between 2 and 30 characters'),
  
  body('negotiable')
    .optional()
    .isBoolean()
    .withMessage('negotiable must be a boolean')
    .toBoolean(),
  
  body('pickupLocation')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Pickup location must be between 3 and 200 characters'),
];

export const validateUpdateListing = [
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
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number')
    .toFloat(),
  
  body('category')
    .optional()
    .isIn(Object.values(ListingCategory))
    .withMessage(`Category must be one of: ${Object.values(ListingCategory).join(', ')}`),
  
  body('condition')
    .optional()
    .isIn(['new', 'like-new', 'good', 'fair', 'poor'])
    .withMessage('Condition must be one of: new, like-new, good, fair, poor'),
  
  body('negotiable')
    .optional()
    .isBoolean()
    .withMessage('negotiable must be a boolean')
    .toBoolean(),
];

export const validateGetListing = [
  validateObjectId('id'),
];

export const validateMarkSold = [
  validateObjectId('id'),
];

export const validateListingFilters = [
  query('category')
    .optional()
    .isIn(Object.values(ListingCategory))
    .withMessage(`Category must be one of: ${Object.values(ListingCategory).join(', ')}`),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('minPrice must be a non-negative number')
    .toFloat(),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('maxPrice must be a non-negative number')
    .toFloat(),
  
  query('available')
    .optional()
    .isBoolean()
    .withMessage('available must be a boolean')
    .toBoolean(),
  
  query('condition')
    .optional()
    .isIn(['new', 'like-new', 'good', 'fair', 'poor'])
    .withMessage('Condition must be one of: new, like-new, good, fair, poor'),
];

export const validateSearchQuery = [
  param('query')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
];