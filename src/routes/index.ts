import { Router } from 'express';
import eventsRouter from './events';
import marketplaceRouter from './marketplace';
import clubsRouter from './clubs';
import usersRouter from './users';
import mediaRouter from './media';

// Create main API router
const router = Router();

// API status endpoint
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'CampusConnect API v1.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      events: '/api/events',
      marketplace: '/api/listings', 
      clubs: '/api/clubs',
      users: '/api/users',
    },
    version: '1.0.0',
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    message: 'CampusConnect API is running!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

// Mount resource routers
router.use('/events', eventsRouter);
router.use('/listings', marketplaceRouter); // Note: using /listings for marketplace as specified
router.use('/clubs', clubsRouter);
router.use('/users', usersRouter);
router.use('/media', mediaRouter);

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'CampusConnect API Documentation',
    version: '1.0.0',
    baseUrl: '/api',
    endpoints: {
      events: {
        'GET /events': 'Get all events with pagination',
        'POST /events': 'Create new event',
        'GET /events/:id': 'Get event by ID',
        'POST /events/:id/attend': 'Join event as attendee',
        'DELETE /events/:id/attend': 'Leave event',
        'GET /events/:id/attendees': 'Get event attendees',
      },
      marketplace: {
        'GET /listings': 'Get all marketplace listings with filters',
        'POST /listings': 'Create new listing',
        'GET /listings/:id': 'Get listing by ID',
        'PUT /listings/:id': 'Update listing',
        'POST /listings/:id/sold': 'Mark listing as sold',
        'GET /listings/categories/all': 'Get all categories with counts',
        'GET /listings/search/:query': 'Search listings',
      },
      clubs: {
        'GET /clubs': 'Get all clubs with pagination',
        'GET /clubs/:id': 'Get club by ID',
        'POST /clubs/:id/join': 'Join club as member',
        'POST /clubs': 'Create new club',
        'DELETE /clubs/:id/leave': 'Leave club',
        'POST /clubs/:id/officers': 'Add officer to club',
        'GET /clubs/:id/members': 'Get club members',
        'GET /clubs/:id/officers': 'Get club officers',
        'GET /clubs/search/:query': 'Search clubs',
      },
      users: {
        'GET /users/:id': 'Get user by ID',
        'PUT /users/:id': 'Update user profile',
        'GET /users': 'Get all users with search',
        'POST /users': 'Create new user',
        'GET /users/:id/profile': 'Get detailed user profile',
        'PATCH /users/:id/avatar': 'Update user avatar',
        'DELETE /users/:id': 'Delete user',
      },
      utility: {
        'GET /status': 'API status and endpoints',
        'GET /health': 'Health check with system info',
        'GET /docs': 'API documentation',
      },
    },
    requestFormat: {
      success: 'All responses include success boolean',
      data: 'Response data in data property',
      message: 'Success/error messages',
      error: 'Error details (development only)',
      pagination: 'Pagination info for list endpoints',
    },
    commonStatusCodes: {
      200: 'Success',
      201: 'Created',
      400: 'Bad Request - Invalid input',
      404: 'Not Found',
      409: 'Conflict - Duplicate resource',
      500: 'Internal Server Error',
    },
    authentication: {
      note: 'Authentication is handled via userId in request body for user-specific actions',
      required: 'userId field required for: joining events, joining clubs, creating resources',
    },
  });
});

// Catch-all for undefined API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.originalUrl}`,
    availableEndpoints: [
      'GET /api/status - API status',
      'GET /api/health - Health check',
      'GET /api/docs - API documentation',
      'GET /api/events - Events API',
      'GET /api/listings - Marketplace API',
      'GET /api/clubs - Clubs API', 
      'GET /api/users - Users API',
    ],
    suggestion: 'Check the API documentation at /api/docs',
  });
});

export default router;