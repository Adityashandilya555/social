import { Router, Request, Response } from 'express';
import { User } from '../models';
import mongoose from 'mongoose';
import { handleValidationErrors, validatePagination } from '../middleware/validation';
import {
  validateCreateUser,
  validateUpdateUser,
  validateUpdateAvatar,
  validateGetUser,
  validateGetUserProfile,
  validateDeleteUser,
  validateUserSearch
} from '../validation/users';

const router = Router();

// GET /api/users/:id - Get user by ID
router.get('/:id', validateGetUser, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    const user = await User.findById(id).select('-__v');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// PUT /api/users/:id - Update user profile
router.put('/:id', validateUpdateUser, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    // Remove sensitive/non-updateable fields
    const allowedUpdates = ['name', 'bio', 'major', 'profilePictureUrl', 'oneSignalPlayerId'];
    const filteredUpdateData: any = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdateData[key] = updateData[key];
      }
    });

    // Validate profile picture URL if provided
    if (filteredUpdateData.profilePictureUrl) {
      const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i;
      if (!urlPattern.test(filteredUpdateData.profilePictureUrl)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid profile picture URL format. Must be a valid image URL',
        });
      }
    }

    // Validate name if provided
    if (filteredUpdateData.name !== undefined) {
      if (typeof filteredUpdateData.name !== 'string' || filteredUpdateData.name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Name must be a non-empty string',
        });
      }
      filteredUpdateData.name = filteredUpdateData.name.trim();
    }

    // Validate bio length if provided
    if (filteredUpdateData.bio !== undefined) {
      if (typeof filteredUpdateData.bio !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Bio must be a string',
        });
      }
      if (filteredUpdateData.bio.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Bio cannot exceed 500 characters',
        });
      }
    }

    // Check if there are any valid fields to update
    if (Object.keys(filteredUpdateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update',
        allowedFields: allowedUpdates,
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      filteredUpdateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      data: { user },
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.message,
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// Additional helper endpoints

// GET /api/users - Get all users (with pagination)
router.get('/', validatePagination.concat(validateUserSearch), handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Optional search query
    const search = req.query.search as string;
    let filter = {};
    
    if (search && search.trim().length > 0) {
      filter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { major: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const users = await User.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        search: search || null,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// POST /api/users - Create new user
router.post('/', validateCreateUser, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    
    // Validate required fields
    if (!userData.name || !userData.email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name and email',
      });
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(userData.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Check if user with email already exists
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Validate profile picture URL if provided
    if (userData.profilePictureUrl) {
      const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i;
      if (!urlPattern.test(userData.profilePictureUrl)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid profile picture URL format',
        });
      }
    }

    const user = new User(userData);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          ...user.toObject(),
          __v: undefined,
        },
      },
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.message,
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// GET /api/users/:id/profile - Get user profile with additional computed data
router.get('/:id/profile', validateGetUserProfile, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    // Get user with aggregated data
    const userProfile = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'clubs',
          localField: '_id',
          foreignField: 'members',
          as: 'memberOfClubs'
        }
      },
      {
        $lookup: {
          from: 'clubs',
          localField: '_id',
          foreignField: 'officers',
          as: 'officerOfClubs'
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: 'host',
          as: 'hostedEvents'
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: 'attendees',
          as: 'attendingEvents'
        }
      },
      {
        $lookup: {
          from: 'marketplacelistings',
          localField: '_id',
          foreignField: 'seller',
          as: 'listings'
        }
      },
      {
        $project: {
          __v: 0,
          'memberOfClubs.__v': 0,
          'officerOfClubs.__v': 0,
          'hostedEvents.__v': 0,
          'attendingEvents.__v': 0,
          'listings.__v': 0,
        }
      },
      {
        $addFields: {
          stats: {
            clubMemberships: { $size: '$memberOfClubs' },
            officerPositions: { $size: '$officerOfClubs' },
            hostedEventsCount: { $size: '$hostedEvents' },
            attendingEventsCount: { $size: '$attendingEvents' },
            activeListings: {
              $size: {
                $filter: {
                  input: '$listings',
                  as: 'listing',
                  cond: { $eq: ['$$listing.isAvailable', true] }
                }
              }
            }
          }
        }
      }
    ]);

    if (!userProfile || userProfile.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { userProfile: userProfile[0] },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// PATCH /api/users/:id/avatar - Update user avatar/profile picture
router.patch('/:id/avatar', validateUpdateAvatar, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { profilePictureUrl } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    if (!profilePictureUrl) {
      return res.status(400).json({
        success: false,
        message: 'Profile picture URL is required',
      });
    }

    // Validate URL format
    const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i;
    if (!urlPattern.test(profilePictureUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image URL format. Must be a valid image URL',
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { profilePictureUrl },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: { 
        user: {
          id: user._id,
          name: user.name,
          profilePictureUrl: user.profilePictureUrl,
        }
      },
    });
  } catch (error: any) {
    console.error('Error updating avatar:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update profile picture',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// DELETE /api/users/:id - Delete user (soft delete or actual delete)
router.delete('/:id', validateDeleteUser, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

export default router;