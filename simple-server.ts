import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CampusConnect API is running!',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'CampusConnect API v1.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 CampusConnect Simple Server Started`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down...');
  server.close();
  process.exit(0);
});