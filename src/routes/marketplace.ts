import { Router, Request, Response } from 'express';
import { MarketplaceListing, ListingCategory } from '../models';
import mongoose from 'mongoose';
import { handleValidationErrors, validatePagination } from '../middleware/validation';
import {
  validateCreateListing,
  validateUpdateListing,
  validateGetListing,
  validateMarkSold,
  validateListingFilters,
  validateSearchQuery
} from '../validation/marketplace';

const router = Router();

// GET /api/listings - Get all marketplace listings
router.get('/', validatePagination.concat(validateListingFilters), handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Query filters
    const category = req.query.category as string;
    const minPrice = parseFloat(req.query.minPrice as string);
    const maxPrice = parseFloat(req.query.maxPrice as string);
    const available = req.query.available !== 'false'; // Default to true

    // Build filter object
    const filter: any = {};
    
    // Filter by availability (only show available listings by default)
    if (available) {
      filter.isAvailable = true;
    }
    
    // Filter by category
    if (category && Object.values(ListingCategory).includes(category as ListingCategory)) {
      filter.category = category;
    }
    
    // Filter by price range
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

    res.status(200).json({
      success: true,
      data: {
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
          category: category || null,
          minPrice: !isNaN(minPrice) ? minPrice : null,
          maxPrice: !isNaN(maxPrice) ? maxPrice : null,
          available,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch marketplace listings',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// GET /api/listings/categories/all - Get all categories with counts (must be before /:id)  
router.get('/categories/all', async (req: Request, res: Response) => {
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

    const totalAvailable = categoryCounts.reduce((sum, cat) => sum + cat.count, 0);

    res.status(200).json({
      success: true,
      data: {
        categories: categoryCounts,
        totalAvailable,
        availableCategories: Object.values(ListingCategory),
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// GET /api/listings/search/:query - Search listings (must be before /:id)
router.get('/search/:query', validateSearchQuery, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { query } = req.params;
    const available = req.query.available !== 'false'; // Default to true

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long',
      });
    }

    const filter: any = {
      $and: [
        available ? { isAvailable: true } : {},
        {
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
          ],
        },
      ],
    };

    const listings = await MarketplaceListing.find(filter)
      .populate('seller', 'name profilePictureUrl')
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: {
        listings,
        query,
        count: listings.length,
      },
    });
  } catch (error) {
    console.error('Error searching listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search listings',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// POST /api/listings - Create new marketplace listing
router.post('/', validateCreateListing, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const listingData = req.body;

    const listing = new MarketplaceListing(listingData);
    await listing.save();
    
    await listing.populate('seller', 'name email profilePictureUrl');

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      data: {
        listing: {
          ...listing.toObject(),
          __v: undefined,
        },
      },
    });
  } catch (error: any) {
    console.error('Error creating listing:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create listing',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// GET /api/listings/:id - Get listing by ID
router.get('/:id', validateGetListing, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const listing = await MarketplaceListing.findById(id)
      .populate('seller', 'name email profilePictureUrl')
      .select('-__v');
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { listing },
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listing',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// Additional helper endpoints

// PUT /api/listings/:id - Update listing
router.put('/:id', validateUpdateListing, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID format',
      });
    }

    // Validate price if being updated
    if (updateData.price !== undefined) {
      if (typeof updateData.price !== 'number' || updateData.price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a non-negative number',
        });
      }
    }

    // Validate category if being updated
    if (updateData.category && !Object.values(ListingCategory).includes(updateData.category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${Object.values(ListingCategory).join(', ')}`,
      });
    }

    const listing = await MarketplaceListing.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('seller', 'name email profilePictureUrl')
    .select('-__v');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Listing updated successfully',
      data: { listing },
    });
  } catch (error: any) {
    console.error('Error updating listing:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update listing',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// POST /api/listings/:id/sold - Mark listing as sold
router.post('/:id/sold', validateMarkSold, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID format',
      });
    }

    const listing = await MarketplaceListing.findById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
      });
    }

    if (!listing.isAvailable) {
      return res.status(409).json({
        success: false,
        message: 'Listing is already marked as sold',
      });
    }

    await listing.markAsSold();

    res.status(200).json({
      success: true,
      message: 'Listing marked as sold',
      data: {
        isAvailable: listing.isAvailable,
      },
    });
  } catch (error) {
    console.error('Error marking listing as sold:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark listing as sold',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});


export default router;