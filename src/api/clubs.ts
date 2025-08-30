import express from 'express';
import { Club } from '../models';

const router = express.Router();

// GET /api/clubs - Get all clubs
router.get('/', async (req, res) => {
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

    res.json({
      clubs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
});

// GET /api/clubs/:id - Get club by ID
router.get('/:id', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('members', 'name email profilePictureUrl')
      .populate('officers', 'name email profilePictureUrl')
      .select('-__v');
    
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    res.json(club);
  } catch (error) {
    console.error('Error fetching club:', error);
    res.status(500).json({ error: 'Failed to fetch club' });
  }
});

// POST /api/clubs - Create new club
router.post('/', async (req, res) => {
  try {
    const club = new Club(req.body);
    await club.save();
    
    await club.populate('members', 'name profilePictureUrl');
    await club.populate('officers', 'name profilePictureUrl');

    res.status(201).json({
      message: 'Club created successfully',
      club: {
        ...club.toObject(),
        __v: undefined,
      },
    });
  } catch (error: any) {
    console.error('Error creating club:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.message 
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Club with this name already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create club' });
  }
});

// PUT /api/clubs/:id - Update club
router.put('/:id', async (req, res) => {
  try {
    const club = await Club.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('members', 'name profilePictureUrl')
    .populate('officers', 'name profilePictureUrl')
    .select('-__v');

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    res.json({
      message: 'Club updated successfully',
      club,
    });
  } catch (error: any) {
    console.error('Error updating club:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.message 
      });
    }
    
    res.status(500).json({ error: 'Failed to update club' });
  }
});

// POST /api/clubs/:id/join - Join club as member
router.post('/:id/join', async (req, res) => {
  try {
    const { userId } = req.body;
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    if (club.members.includes(userId)) {
      return res.status(409).json({ error: 'User is already a member of this club' });
    }

    await club.addMember(userId);

    res.json({
      message: 'Successfully joined club',
      memberCount: club.members.length,
    });
  } catch (error) {
    console.error('Error joining club:', error);
    res.status(500).json({ error: 'Failed to join club' });
  }
});

// DELETE /api/clubs/:id/leave - Leave club
router.delete('/:id/leave', async (req, res) => {
  try {
    const { userId } = req.body;
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    await club.removeMember(userId);

    res.json({
      message: 'Successfully left club',
      memberCount: club.members.length,
    });
  } catch (error) {
    console.error('Error leaving club:', error);
    res.status(500).json({ error: 'Failed to leave club' });
  }
});

// POST /api/clubs/:id/officers - Add officer to club
router.post('/:id/officers', async (req, res) => {
  try {
    const { userId } = req.body;
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    await club.addOfficer(userId);

    res.json({
      message: 'Successfully added officer',
      officerCount: club.officers.length,
    });
  } catch (error) {
    console.error('Error adding officer:', error);
    res.status(500).json({ error: 'Failed to add officer' });
  }
});

// DELETE /api/clubs/:id/officers - Remove officer from club
router.delete('/:id/officers', async (req, res) => {
  try {
    const { userId } = req.body;
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    await club.removeOfficer(userId);

    res.json({
      message: 'Successfully removed officer',
      officerCount: club.officers.length,
    });
  } catch (error) {
    console.error('Error removing officer:', error);
    res.status(500).json({ error: 'Failed to remove officer' });
  }
});

// GET /api/clubs/search/:query - Search clubs by name or description
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const clubs = await Club.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    })
    .populate('members', 'name profilePictureUrl')
    .populate('officers', 'name profilePictureUrl')
    .select('-__v')
    .limit(20);

    res.json({ clubs });
  } catch (error) {
    console.error('Error searching clubs:', error);
    res.status(500).json({ error: 'Failed to search clubs' });
  }
});

// DELETE /api/clubs/:id - Delete club
router.delete('/:id', async (req, res) => {
  try {
    const club = await Club.findByIdAndDelete(req.params.id);

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    res.json({ message: 'Club deleted successfully' });
  } catch (error) {
    console.error('Error deleting club:', error);
    res.status(500).json({ error: 'Failed to delete club' });
  }
});

export default router;