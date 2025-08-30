import express from 'express';
import { MarketplaceListing, ListingCategory } from '../models';

const router = express.Router();

// GET /api/marketplace - Get all marketplace listings
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category as string;
    const minPrice = parseFloat(req.query.minPrice as string);
    const maxPrice = parseFloat(req.query.maxPrice as string);

    // Build filter object
    const filter: any = { isAvailable: true };
    
    if (category && Object.values(ListingCategory).includes(category as ListingCategory)) {
      filter.category = category;
    }
    
    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      filter.price = {};
      if (!isNaN(minPrice)) filter.price.$gte = minPrice;
      if (!isNaN(maxPrice)) filter.price.$lte = maxPrice;
    }

    const listings = await MarketplaceListing.find(filter)
      .populate('seller', 'name email profilePictureUrl')
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MarketplaceListing.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        category,
        minPrice,
        maxPrice,
      },
    });
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    res.status(500).json({ error: 'Failed to fetch marketplace listings' });
  }
});

// GET /api/marketplace/:id - Get listing by ID
router.get('/:id', async (req, res) => {
  try {
    const listing = await MarketplaceListing.findById(req.params.id)
      .populate('seller', 'name email profilePictureUrl')
      .select('-__v');
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(listing);
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// POST /api/marketplace - Create new listing
router.post('/', async (req, res) => {
  try {
    const listing = new MarketplaceListing(req.body);
    await listing.save();
    
    await listing.populate('seller', 'name email profilePictureUrl');

    res.status(201).json({
      message: 'Listing created successfully',
      listing: {
        ...listing.toObject(),
        __v: undefined,
      },
    });
  } catch (error: any) {
    console.error('Error creating listing:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.message 
      });
    }
    
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// PUT /api/marketplace/:id - Update listing
router.put('/:id', async (req, res) => {
  try {
    const listing = await MarketplaceListing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('seller', 'name email profilePictureUrl')
    .select('-__v');

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({
      message: 'Listing updated successfully',
      listing,
    });
  } catch (error: any) {
    console.error('Error updating listing:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.message 
      });
    }
    
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

// POST /api/marketplace/:id/sold - Mark listing as sold
router.post('/:id/sold', async (req, res) => {
  try {
    const listing = await MarketplaceListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    await listing.markAsSold();

    res.json({
      message: 'Listing marked as sold',
      isAvailable: listing.isAvailable,
    });
  } catch (error) {
    console.error('Error marking listing as sold:', error);
    res.status(500).json({ error: 'Failed to mark listing as sold' });
  }
});

// POST /api/marketplace/:id/available - Mark listing as available
router.post('/:id/available', async (req, res) => {
  try {
    const listing = await MarketplaceListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    await listing.markAsAvailable();

    res.json({
      message: 'Listing marked as available',
      isAvailable: listing.isAvailable,
    });
  } catch (error) {
    console.error('Error marking listing as available:', error);
    res.status(500).json({ error: 'Failed to mark listing as available' });
  }
});

// GET /api/marketplace/categories - Get all listing categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = Object.values(ListingCategory);
    const categoryCounts = await Promise.all(
      categories.map(async (category) => {
        const count = await MarketplaceListing.countDocuments({ 
          category, 
          isAvailable: true 
        });
        return { category, count };
      })
    );

    res.json({
      categories: categoryCounts,
      total: categoryCounts.reduce((sum, cat) => sum + cat.count, 0),
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/marketplace/search/:query - Search listings
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const listings = await MarketplaceListing.find({
      $and: [
        { isAvailable: true },
        {
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
          ],
        },
      ],
    })
    .populate('seller', 'name profilePictureUrl')
    .select('-__v')
    .limit(20);

    res.json({ listings });
  } catch (error) {
    console.error('Error searching listings:', error);
    res.status(500).json({ error: 'Failed to search listings' });
  }
});

// GET /api/marketplace/user/:userId - Get listings by user
router.get('/user/:userId', async (req, res) => {
  try {
    const listings = await MarketplaceListing.find({ 
      seller: req.params.userId 
    })
    .populate('seller', 'name profilePictureUrl')
    .select('-__v')
    .sort({ createdAt: -1 });

    res.json({ listings });
  } catch (error) {
    console.error('Error fetching user listings:', error);
    res.status(500).json({ error: 'Failed to fetch user listings' });
  }
});

// DELETE /api/marketplace/:id - Delete listing
router.delete('/:id', async (req, res) => {
  try {
    const listing = await MarketplaceListing.findByIdAndDelete(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

export default router;