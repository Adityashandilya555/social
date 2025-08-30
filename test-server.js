const express = require('express');
const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Test server running!' 
  });
});

app.get('/api/status', (req, res) => {
  res.json({ 
    success: true,
    message: 'API is working!' 
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

// Keep the server running
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close();
  process.exit(0);
});