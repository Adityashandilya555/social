# 🚀 Heroku Deployment Guide for CampusConnect

This guide provides step-by-step instructions for deploying your Node.js/Express CampusConnect application to Heroku with automatic GitHub integration.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher)
- [Git](https://git-scm.com/) installed
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
- GitHub account
- Heroku account (free tier available)
- MongoDB Atlas database (with connection string)

## 📁 Required Files

Your project should have these deployment files (already created):

```
CampusConnect/
├── Procfile                 # Tells Heroku how to start your app
├── app.json                # Heroku app configuration
├── package.json            # Dependencies and scripts
└── .env.example            # Environment variables template
```

## 🔧 Step 1: Prepare Your Application

### 1.1 Verify package.json Scripts

Ensure your `package.json` has these scripts:

```json
{
  "scripts": {
    "build": "tsc && npm run copy-assets",
    "copy-assets": "cp -r src/assets dist/ || mkdir -p dist && cp -r src/assets dist/ || echo 'No assets to copy'",
    "serve": "node dist/server.js",
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "heroku-postbuild": "npm run build"
  }
}
```

### 1.2 Create a Basic Express Server (if not exists)

Create `src/server.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import connectToMongoDB from './utils/mongoConnection';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CampusConnect API is running!',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.get('/api/status', (req, res) => {
  res.json({ message: 'CampusConnect API v1.0' });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
```

## 🐙 Step 2: GitHub Repository Setup

### 2.1 Initialize Git Repository (if not done)

```bash
cd CampusConnect
git init
git add .
git commit -m "Initial commit: CampusConnect app setup"
```

### 2.2 Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click **"New repository"**
3. Name it `CampusConnect`
4. Choose **Public** or **Private**
5. Click **"Create repository"**

### 2.3 Connect Local Repository to GitHub

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/CampusConnect.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## 🌐 Step 3: Create Heroku App

### 3.1 Using Heroku CLI

```bash
# Login to Heroku
heroku login

# Create new Heroku app
heroku create campusconnect-app

# Note: App name must be unique globally
# If taken, try: campusconnect-YOUR_USERNAME or add random numbers
```

### 3.2 Using Heroku Dashboard

1. Go to [Heroku Dashboard](https://dashboard.heroku.com/)
2. Click **"New"** → **"Create new app"**
3. Enter app name: `campusconnect-app` (or similar)
4. Choose region: **United States** or **Europe**
5. Click **"Create app"**

## 🔗 Step 4: Link GitHub Repository to Heroku

### 4.1 Connect Repository

1. In your Heroku app dashboard, go to **"Deploy"** tab
2. Under **"Deployment method"**, select **"GitHub"**
3. Click **"Connect to GitHub"**
4. Search for `CampusConnect` repository
5. Click **"Connect"**

### 4.2 Enable Automatic Deployments

1. Scroll to **"Automatic deploys"** section
2. Select branch: `main`
3. ✅ Check **"Wait for CI to pass before deploy"** (optional)
4. Click **"Enable Automatic Deploys"**

Now, every push to your `main` branch will automatically deploy to Heroku! 🎉

## ⚙️ Step 5: Set Environment Variables

### 5.1 Using Heroku Dashboard

1. Go to your app's **"Settings"** tab
2. Click **"Reveal Config Vars"**
3. Add these environment variables:

| KEY | VALUE | DESCRIPTION |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Node environment |
| `MONGO_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
| `API_BASE_URL` | `https://your-app.herokuapp.com` | Your Heroku app URL |

### 5.2 Using Heroku CLI

```bash
# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/campusconnect?retryWrites=true&w=majority"
heroku config:set API_BASE_URL="https://campusconnect-app.herokuapp.com"

# View all config vars
heroku config
```

### 5.3 MongoDB Atlas Connection String

Your `MONGO_URI` should look like:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/campusconnect?retryWrites=true&w=majority&appName=Cluster0
```

**Important**: Use the actual database credentials, not the placeholder values!

## 🚀 Step 6: Deploy Your Application

### 6.1 Manual Deploy (First Time)

1. In Heroku dashboard, go to **"Deploy"** tab
2. Scroll to **"Manual deploy"**
3. Select branch: `main`
4. Click **"Deploy Branch"**

### 6.2 Using Git Push

```bash
# Add Heroku remote (if using CLI method)
heroku git:remote -a campusconnect-app

# Deploy to Heroku
git push heroku main
```

### 6.3 Monitor Deployment

```bash
# View build logs
heroku logs --tail

# View app info
heroku apps:info

# Open your app in browser
heroku open
```

## ✅ Step 7: Verify Deployment

### 7.1 Check Application Status

Visit your app URLs:
- **Main App**: `https://campusconnect-app.herokuapp.com`
- **Health Check**: `https://campusconnect-app.herokuapp.com/health`
- **API Status**: `https://campusconnect-app.herokuapp.com/api/status`

### 7.2 Test Database Connection

Your app should automatically connect to MongoDB Atlas using the `MONGO_URI` environment variable.

## 🔧 Step 8: Configure Automatic Deployments

### 8.1 Branch Protection (Optional)

1. Go to your GitHub repository
2. **Settings** → **Branches**
3. Click **"Add rule"** for `main` branch
4. Enable **"Require pull request reviews"**
5. Enable **"Require status checks to pass"**

### 8.2 Deployment Workflow

Now your deployment workflow is:
1. Make changes locally
2. Commit and push to GitHub: `git push origin main`
3. Heroku automatically deploys the changes
4. Check deployment status in Heroku dashboard

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Build Failures
```bash
# Check build logs
heroku logs --tail

# Common fixes:
# - Ensure all dependencies are in package.json
# - Check TypeScript compilation errors
# - Verify Node.js version compatibility
```

#### 2. Database Connection Issues
```bash
# Check MongoDB connection
heroku config:get MONGO_URI

# Test connection locally
npm run dev
```

#### 3. Environment Variables
```bash
# List all config vars
heroku config

# Set missing variables
heroku config:set VARIABLE_NAME="value"
```

#### 4. Port Issues
Ensure your server uses `process.env.PORT`:
```typescript
const PORT = process.env.PORT || 5000;
```

### Useful Heroku Commands

```bash
# Restart app
heroku restart

# View app logs
heroku logs --tail

# Run commands on Heroku
heroku run node --version

# Scale app (free tier: 1 dyno max)
heroku ps:scale web=1

# Check app status
heroku ps
```

## 🎯 Step 9: Domain and SSL (Optional)

### 9.1 Custom Domain

```bash
# Add custom domain (requires paid plan)
heroku domains:add www.campusconnect.com

# View domains
heroku domains
```

### 9.2 SSL Certificate

Heroku provides automatic SSL for `.herokuapp.com` domains. For custom domains, you'll need to upgrade to a paid plan.

## 📊 Monitoring and Maintenance

### 9.1 Heroku Metrics

- View app metrics in Heroku dashboard
- Monitor response times, throughput, and errors
- Set up alerts for downtime

### 9.2 Database Monitoring

- Use MongoDB Atlas monitoring
- Set up alerts for connection issues
- Monitor database performance

## 🔄 Continuous Integration (Optional)

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Heroku

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{secrets.HEROKU_API_KEY}}
        heroku_app_name: "campusconnect-app"
        heroku_email: "your-email@example.com"
```

## 🎉 Success!

Your CampusConnect application is now deployed on Heroku with:
- ✅ Automatic deployments from GitHub
- ✅ Environment variables configured
- ✅ MongoDB Atlas connection
- ✅ SSL certificate (automatic)
- ✅ Custom domain support (optional)

## 📚 Additional Resources

- [Heroku Dev Center](https://devcenter.heroku.com/)
- [Heroku CLI Documentation](https://devcenter.heroku.com/articles/heroku-cli)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**Need help?** Check the [Heroku Status Page](https://status.heroku.com/) or contact support if you encounter issues.