import { Router, Request, Response } from 'express';
import { Event } from '../models';
import mongoose from 'mongoose';
import { handleValidationErrors, validatePagination } from '../middleware/validation';
import {
  validateCreateEvent,
  validateJoinEvent,
  validateGetEvent,
  validateUpdateEvent
} from '../validation/events';

const router = Router();

// GET /api/events - Get all events
router.get('/', validatePagination, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const events = await Event.find()
      .populate('host', 'name email profilePictureUrl')
      .populate('attendees', 'name profilePictureUrl')
      .select('-__v')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        events,
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
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// POST /api/events - Create new event
router.post('/', validateCreateEvent, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const eventData = req.body;

    // Additional business logic validation
    const startTime = new Date(eventData.startTime);
    
    if (startTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be in the future',
      });
    }

    const event = new Event(eventData);
    await event.save();
    
    await event.populate('host', 'name email profilePictureUrl');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        event: {
          ...event.toObject(),
          __v: undefined,
        },
      },
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// GET /api/events/:id - Get event by ID
router.get('/:id', validateGetEvent, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format',
      });
    }

    const event = await Event.findById(id)
      .populate('host', 'name email profilePictureUrl')
      .populate('attendees', 'name profilePictureUrl')
      .select('-__v');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { event },
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// POST /api/events/:id/attend - Add current user to attendees list
router.post('/:id/attend', validateJoinEvent, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if event has already started
    if (event.startTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot attend event that has already started',
      });
    }

    // Check if user is already attending
    const isAlreadyAttending = event.attendees.some(
      attendeeId => attendeeId.toString() === userId
    );

    if (isAlreadyAttending) {
      return res.status(409).json({
        success: false,
        message: 'User is already attending this event',
      });
    }

    // Check if user is the host
    if (event.host.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Event host is automatically attending',
      });
    }

    // Add user to attendees
    event.attendees.push(new mongoose.Types.ObjectId(userId));
    await event.save();

    await event.populate('attendees', 'name profilePictureUrl');

    res.status(200).json({
      success: true,
      message: 'Successfully joined event',
      data: {
        attendeeCount: event.attendees.length,
        isAttending: true,
      },
    });
  } catch (error) {
    console.error('Error joining event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join event',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// Additional helper endpoints

// GET /api/events/:id/attendees - Get event attendees
router.get('/:id/attendees', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format',
      });
    }

    const event = await Event.findById(id)
      .populate('attendees', 'name email profilePictureUrl')
      .select('attendees');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        attendees: event.attendees,
        count: event.attendees.length,
      },
    });
  } catch (error) {
    console.error('Error fetching attendees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendees',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// DELETE /api/events/:id/attend - Remove user from attendees
router.delete('/:id/attend', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format',
      });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required in request body',
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Remove user from attendees
    event.attendees = event.attendees.filter(
      attendeeId => attendeeId.toString() !== userId
    );
    
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Successfully left event',
      data: {
        attendeeCount: event.attendees.length,
        isAttending: false,
      },
    });
  } catch (error) {
    console.error('Error leaving event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave event',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

export default router;