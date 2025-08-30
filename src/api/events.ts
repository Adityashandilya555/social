import express from 'express';
import { Event } from '../models';

const router = express.Router();

// GET /api/events - Get all events
router.get('/', async (req, res) => {
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

    res.json({
      events,
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
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/:id - Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('host', 'name email profilePictureUrl')
      .populate('attendees', 'name profilePictureUrl')
      .select('-__v');
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// POST /api/events - Create new event
router.post('/', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    
    await event.populate('host', 'name email profilePictureUrl');

    res.status(201).json({
      message: 'Event created successfully',
      event: {
        ...event.toObject(),
        __v: undefined,
      },
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.message 
      });
    }
    
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('host', 'name email profilePictureUrl')
    .populate('attendees', 'name profilePictureUrl')
    .select('-__v');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      message: 'Event updated successfully',
      event,
    });
  } catch (error: any) {
    console.error('Error updating event:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.message 
      });
    }
    
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// POST /api/events/:id/attend - Join event as attendee
router.post('/:id/attend', async (req, res) => {
  try {
    const { userId } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.attendees.includes(userId)) {
      return res.status(409).json({ error: 'User already attending this event' });
    }

    event.attendees.push(userId);
    await event.save();

    await event.populate('attendees', 'name profilePictureUrl');

    res.json({
      message: 'Successfully joined event',
      attendeeCount: event.attendees.length,
    });
  } catch (error) {
    console.error('Error joining event:', error);
    res.status(500).json({ error: 'Failed to join event' });
  }
});

// DELETE /api/events/:id/attend - Leave event
router.delete('/:id/attend', async (req, res) => {
  try {
    const { userId } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    event.attendees = event.attendees.filter(
      attendeeId => !attendeeId.equals(userId)
    );
    await event.save();

    res.json({
      message: 'Successfully left event',
      attendeeCount: event.attendees.length,
    });
  } catch (error) {
    console.error('Error leaving event:', error);
    res.status(500).json({ error: 'Failed to leave event' });
  }
});

// GET /api/events/upcoming - Get upcoming events
router.get('/filter/upcoming', async (req, res) => {
  try {
    const events = await Event.find({
      startTime: { $gte: new Date() }
    })
    .populate('host', 'name email profilePictureUrl')
    .populate('attendees', 'name profilePictureUrl')
    .select('-__v')
    .sort({ startTime: 1 })
    .limit(20);

    res.json({ events });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;