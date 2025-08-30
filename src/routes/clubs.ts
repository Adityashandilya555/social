import { Router, Request, Response } from 'express';
import { Club } from '../models';
import mongoose from 'mongoose';
import { handleValidationErrors, validatePagination } from '../middleware/validation';
import {
  validateCreateClub,
  validateJoinClub,
  validateLeaveClub,
  validateAddOfficer,
  validateGetClub,
  validateGetClubMembers,
  validateGetClubOfficers,
  validateSearchClubs
} from '../validation/clubs';

const router = Router();

// GET /api/clubs - Get all clubs
router.get('/', validatePagination, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const clubs = await Club.find()
      .populate('members', 'name profilePictureUrl')
      .populate('officers', 'name profilePictureUrl')
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Club.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        clubs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clubs',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// GET /api/clubs/search/:query - Search clubs by name or description (must be before /:id)
router.get('/search/:query', validateSearchClubs, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { query } = req.params;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long',
      });
    }

    const clubs = await Club.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    })
    .populate('members', 'name profilePictureUrl')
    .populate('officers', 'name profilePictureUrl')
    .select('-__v')
    .sort({ memberCount: -1 }) // Sort by member count descending
    .limit(20);

    res.status(200).json({
      success: true,
      data: {
        clubs,
        query,
        count: clubs.length,
      },
    });
  } catch (error) {
    console.error('Error searching clubs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search clubs',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// GET /api/clubs/:id - Get club by ID
router.get('/:id', validateGetClub, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid club ID format',
      });
    }

    const club = await Club.findById(id)
      .populate('members', 'name email profilePictureUrl')
      .populate('officers', 'name email profilePictureUrl')
      .select('-__v');
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    // Add computed fields
    const clubData = {
      ...club.toObject(),
      memberCount: club.members.length,
      officerCount: club.officers.length,
    };

    res.status(200).json({
      success: true,
      data: { club: clubData },
    });
  } catch (error) {
    console.error('Error fetching club:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch club',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// POST /api/clubs/:id/join - Join club as member
router.post('/:id/join', validateJoinClub, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Validate ID formats
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid club ID format',
      });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required in request body',
      });
    }

    const club = await Club.findById(id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    // Check if user is already a member
    const isAlreadyMember = club.members.some(
      memberId => memberId.toString() === userId
    );

    if (isAlreadyMember) {
      return res.status(409).json({
        success: false,
        message: 'User is already a member of this club',
      });
    }

    // Use the club's addMember method
    await club.addMember(new mongoose.Types.ObjectId(userId));

    // Populate the members for response
    await club.populate('members', 'name profilePictureUrl');

    res.status(200).json({
      success: true,
      message: 'Successfully joined club',
      data: {
        memberCount: club.members.length,
        isMember: true,
      },
    });
  } catch (error) {
    console.error('Error joining club:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join club',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// Additional helper endpoints

// POST /api/clubs - Create new club
router.post('/', validateCreateClub, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const clubData = req.body;

    // Validate required fields
    if (!clubData.name) {
      return res.status(400).json({
        success: false,
        message: 'Club name is required',
      });
    }

    // Validate officer IDs if provided
    if (clubData.officers && Array.isArray(clubData.officers)) {
      const invalidOfficers = clubData.officers.filter(
        (officerId: string) => !mongoose.Types.ObjectId.isValid(officerId)
      );
      
      if (invalidOfficers.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid officer ID format',
          invalidIds: invalidOfficers,
        });
      }
    }

    // Validate member IDs if provided
    if (clubData.members && Array.isArray(clubData.members)) {
      const invalidMembers = clubData.members.filter(
        (memberId: string) => !mongoose.Types.ObjectId.isValid(memberId)
      );
      
      if (invalidMembers.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid member ID format',
          invalidIds: invalidMembers,
        });
      }
    }

    const club = new Club(clubData);
    await club.save();
    
    await club.populate('members', 'name profilePictureUrl');
    await club.populate('officers', 'name profilePictureUrl');

    res.status(201).json({
      success: true,
      message: 'Club created successfully',
      data: {
        club: {
          ...club.toObject(),
          __v: undefined,
        },
      },
    });
  } catch (error: any) {
    console.error('Error creating club:', error);
    
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
        message: 'Club with this name already exists',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create club',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// DELETE /api/clubs/:id/leave - Leave club
router.delete('/:id/leave', validateLeaveClub, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid club ID format',
      });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required in request body',
      });
    }

    const club = await Club.findById(id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    // Check if user is a member
    const isMember = club.members.some(
      memberId => memberId.toString() === userId
    );

    if (!isMember) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this club',
      });
    }

    // Use the club's removeMember method (also removes from officers if applicable)
    await club.removeMember(new mongoose.Types.ObjectId(userId));

    res.status(200).json({
      success: true,
      message: 'Successfully left club',
      data: {
        memberCount: club.members.length,
        isMember: false,
      },
    });
  } catch (error) {
    console.error('Error leaving club:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave club',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// POST /api/clubs/:id/officers - Add officer to club
router.post('/:id/officers', validateAddOfficer, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid club ID format',
      });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required in request body',
      });
    }

    const club = await Club.findById(id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    // Check if user is already an officer
    const isAlreadyOfficer = club.officers.some(
      officerId => officerId.toString() === userId
    );

    if (isAlreadyOfficer) {
      return res.status(409).json({
        success: false,
        message: 'User is already an officer of this club',
      });
    }

    // Use the club's addOfficer method (also adds as member if not already)
    await club.addOfficer(new mongoose.Types.ObjectId(userId));

    res.status(200).json({
      success: true,
      message: 'Successfully added officer',
      data: {
        officerCount: club.officers.length,
        memberCount: club.members.length,
      },
    });
  } catch (error) {
    console.error('Error adding officer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add officer',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// GET /api/clubs/:id/members - Get club members
router.get('/:id/members', validateGetClubMembers, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid club ID format',
      });
    }

    const club = await Club.findById(id)
      .populate('members', 'name email profilePictureUrl')
      .select('members');

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        members: club.members,
        count: club.members.length,
      },
    });
  } catch (error) {
    console.error('Error fetching club members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch club members',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// GET /api/clubs/:id/officers - Get club officers
router.get('/:id/officers', validateGetClubOfficers, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid club ID format',
      });
    }

    const club = await Club.findById(id)
      .populate('officers', 'name email profilePictureUrl')
      .select('officers');

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        officers: club.officers,
        count: club.officers.length,
      },
    });
  } catch (error) {
    console.error('Error fetching club officers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch club officers',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

export default router;