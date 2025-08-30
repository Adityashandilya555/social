import express from 'express';
import userRoutes from './users';
import eventRoutes from './events';
import clubRoutes from './clubs';
import marketplaceRoutes from './marketplace';
import postRoutes from './posts';

const router = express.Router();

// API status endpoint
router.get('/status', (req, res) => {
  res.json({
    message: 'CampusConnect API v1.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      users: '/api/users',
      events: '/api/events',
      clubs: '/api/clubs',
      marketplace: '/api/marketplace',
      posts: '/api/posts',
    },
  });
});

// Mount route modules
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/clubs', clubRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/posts', postRoutes);

export default router;