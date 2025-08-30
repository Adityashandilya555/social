import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './src/routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CampusConnect API with Enhanced Validation is running!',
    timestamp: new Date().toISOString(),
    features: [
      'Express-validator input validation',
      'EndTime after startTime validation for events',
      'Duplicate attendee prevention',
      'Comprehensive field validation for all endpoints'
    ]
  });
});

// Mount API routes
app.use('/api', apiRoutes);

const server = app.listen(PORT, () => {
  console.log(`🚀 Enhanced CampusConnect API Server Started`);
  console.log(`🛡️  Features: Input validation with express-validator`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API docs: http://localhost:${PORT}/api/docs`);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down...');
  server.close();
  process.exit(0);
});