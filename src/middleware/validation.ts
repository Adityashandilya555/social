import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : error.type,
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
    });
  }
  
  next();
};

export const validateObjectId = (fieldName: string = 'id') => {
  return param(fieldName)
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(`Invalid ${fieldName} format`);
      }
      return true;
    });
};

export const validateOptionalObjectId = (fieldName: string) => {
  return body(fieldName)
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(`Invalid ${fieldName} format`);
      }
      return true;
    });
};

export const validateRequiredObjectId = (fieldName: string) => {
  return body(fieldName)
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(`Invalid ${fieldName} format`);
      }
      return true;
    });
};

export const validateUrl = (fieldName: string, optional: boolean = false) => {
  const validator = optional ? body(fieldName).optional() : body(fieldName);
  
  return validator
    .isURL({ protocols: ['http', 'https'] })
    .withMessage(`${fieldName} must be a valid URL`);
};

export const validateImageUrl = (fieldName: string, optional: boolean = false) => {
  const validator = optional ? body(fieldName).optional() : body(fieldName);
  
  return validator
    .matches(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i)
    .withMessage(`${fieldName} must be a valid image URL (jpg, jpeg, png, webp, gif)`);
};

export const validateEmail = (fieldName: string = 'email', optional: boolean = false) => {
  const validator = optional ? body(fieldName).optional() : body(fieldName);
  
  return validator
    .normalizeEmail()
    .isEmail()
    .withMessage(`${fieldName} must be a valid email address`);
};

export const validateDateTime = (fieldName: string, optional: boolean = false) => {
  const validator = optional ? body(fieldName).optional() : body(fieldName);
  
  return validator
    .isISO8601()
    .withMessage(`${fieldName} must be a valid ISO 8601 datetime`)
    .toDate();
};

export const validateDateTimeAfter = (fieldName: string, afterField: string) => {
  return body(fieldName)
    .isISO8601()
    .withMessage(`${fieldName} must be a valid ISO 8601 datetime`)
    .toDate()
    .custom((value, { req }) => {
      const afterValue = new Date(req.body[afterField]);
      if (value <= afterValue) {
        throw new Error(`${fieldName} must be after ${afterField}`);
      }
      return true;
    });
};

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
];

export const validateArrayLength = (fieldName: string, maxLength: number, optional: boolean = false) => {
  const validator = optional ? body(fieldName).optional() : body(fieldName);
  
  return validator
    .isArray()
    .withMessage(`${fieldName} must be an array`)
    .isLength({ max: maxLength })
    .withMessage(`${fieldName} cannot exceed ${maxLength} items`);
};