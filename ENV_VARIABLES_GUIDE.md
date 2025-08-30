# 🔐 Environment Variables Setup Guide

This guide explains how to set up and manage environment variables for your CampusConnect application across different platforms.

## 📝 Required Environment Variables

Your CampusConnect application needs these environment variables:

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NODE_ENV` | Application environment | Yes | `production`, `development`, `test` |
| `MONGO_URI` | MongoDB Atlas connection string | Yes | `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/campusconnect` |
| `API_BASE_URL` | Base URL for API endpoints | Optional | `https://campusconnect-app.herokuapp.com` |
| `JWT_SECRET` | Secret key for JWT tokens | Optional | `your-super-secret-key-here` |
| `PORT` | Server port (auto-set by Heroku) | Optional | `5000` |

## 🏠 Local Development (.env file)

### 1. Create .env File

```bash
# In your project root
touch .env
```

### 2. Add Variables to .env

```bash
# .env file content
NODE_ENV=development
MONGO_URI=mongodb+srv://adityashandilya10_db_user:wLM5IdumtsyR970X@cluster0.ap9vl7j.mongodb.net/campusconnect?retryWrites=true&w=majority&appName=Cluster0
API_BASE_URL=http://localhost:5000
JWT_SECRET=your-local-development-secret-key
PORT=5000
```

### 3. Add .env to .gitignore

```bash
# Add to .gitignore
echo ".env" >> .gitignore
```

**⚠️ IMPORTANT**: Never commit `.env` files to version control!

## 🌐 Heroku Dashboard Method

### Step 1: Access Config Vars

1. Go to [Heroku Dashboard](https://dashboard.heroku.com/)
2. Select your app (`campusconnect-app`)
3. Click **"Settings"** tab
4. Scroll to **"Config Vars"** section
5. Click **"Reveal Config Vars"**

### Step 2: Add Environment Variables

Click **"Add"** button and enter each variable:

#### NODE_ENV
- **KEY**: `NODE_ENV`
- **VALUE**: `production`

#### MONGO_URI
- **KEY**: `MONGO_URI`
- **VALUE**: `mongodb+srv://adityashandilya10_db_user:wLM5IdumtsyR970X@cluster0.ap9vl7j.mongodb.net/campusconnect?retryWrites=true&w=majority&appName=Cluster0`

#### API_BASE_URL
- **KEY**: `API_BASE_URL`
- **VALUE**: `https://campusconnect-app.herokuapp.com` (replace with your actual Heroku app URL)

#### JWT_SECRET (if needed)
- **KEY**: `JWT_SECRET`
- **VALUE**: `production-super-secret-key-change-this`

### Step 3: Save Changes

- Click **"Add"** for each variable
- Changes are applied automatically
- Your app will restart with new variables

## 💻 Heroku CLI Method

### Install Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows (with Chocolatey)
choco install heroku-cli

# Or download from https://devcenter.heroku.com/articles/heroku-cli
```

### Login to Heroku

```bash
heroku login
```

### Set Environment Variables

```bash
# Set individual variables
heroku config:set NODE_ENV=production -a campusconnect-app
heroku config:set MONGO_URI="mongodb+srv://adityashandilya10_db_user:wLM5IdumtsyR970X@cluster0.ap9vl7j.mongodb.net/campusconnect?retryWrites=true&w=majority&appName=Cluster0" -a campusconnect-app
heroku config:set API_BASE_URL="https://campusconnect-app.herokuapp.com" -a campusconnect-app

# Set multiple variables at once
heroku config:set \
  NODE_ENV=production \
  MONGO_URI="mongodb+srv://adityashandilya10_db_user:wLM5IdumtsyR970X@cluster0.ap9vl7j.mongodb.net/campusconnect?retryWrites=true&w=majority&appName=Cluster0" \
  API_BASE_URL="https://campusconnect-app.herokuapp.com" \
  -a campusconnect-app
```

### View All Config Variables

```bash
# List all environment variables
heroku config -a campusconnect-app

# Get specific variable
heroku config:get MONGO_URI -a campusconnect-app
```

### Remove Environment Variables

```bash
# Remove a variable
heroku config:unset JWT_SECRET -a campusconnect-app
```

## 🔧 Using Environment Variables in Code

### 1. TypeScript Declarations

Update `src/utils/env.d.ts`:

```typescript
declare module '@env' {
  export const NODE_ENV: string;
  export const API_BASE_URL: string;
  export const MONGODB_URI: string;
  export const MONGO_URI: string;
  export const JWT_SECRET: string;
  export const PORT: string;
}
```

### 2. Import in Your Code

```typescript
// Using react-native-dotenv
import { MONGO_URI, NODE_ENV, API_BASE_URL } from '@env';

// Using process.env (for Node.js server)
const mongoUri = process.env.MONGO_URI;
const nodeEnv = process.env.NODE_ENV;
const port = process.env.PORT || 5000;
```

### 3. Example Server Usage

```typescript
// src/server.ts
import express from 'express';
import connectToMongoDB from './utils/mongoConnection';

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`🌍 Environment: ${NODE_ENV}`);
console.log(`🚀 Server starting on port: ${PORT}`);

// Connect to database using MONGO_URI
connectToMongoDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
});
```

## 🔒 MongoDB Atlas Connection String

### Format

```
mongodb+srv://username:password@cluster.mongodb.net/database?options
```

### Your Connection String

```
mongodb+srv://adityashandilya10_db_user:wLM5IdumtsyR970X@cluster0.ap9vl7j.mongodb.net/campusconnect?retryWrites=true&w=majority&appName=Cluster0
```

### Breaking Down the Connection String

- **Protocol**: `mongodb+srv://`
- **Username**: `adityashandilya10_db_user`
- **Password**: `wLM5IdumtsyR970X`
- **Cluster**: `cluster0.ap9vl7j.mongodb.net`
- **Database**: `campusconnect`
- **Options**: `retryWrites=true&w=majority&appName=Cluster0`

## 🔍 Troubleshooting Environment Variables

### 1. Check if Variables are Set

```bash
# In Heroku
heroku config -a campusconnect-app

# Locally (if using dotenv)
node -e "require('dotenv').config(); console.log(process.env.MONGO_URI);"
```

### 2. Common Issues

#### Variables Not Loading
```typescript
// Check if environment variables are loaded
console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set ✅' : 'Missing ❌');
console.log('PORT:', process.env.PORT);
```

#### Connection String Issues
```typescript
// Validate MongoDB URI format
const validateMongoUri = (uri: string) => {
  if (!uri) {
    throw new Error('MONGO_URI is not defined');
  }
  
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error('Invalid MONGO_URI format');
  }
  
  console.log('✅ MONGO_URI format is valid');
};
```

#### Environment-Specific Values
```typescript
// src/config/environment.ts
const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const config = {
    development: {
      apiUrl: 'http://localhost:5000',
      dbName: 'campusconnect-dev'
    },
    production: {
      apiUrl: process.env.API_BASE_URL,
      dbName: 'campusconnect'
    }
  };
  
  return config[env as keyof typeof config];
};
```

## 🔧 Advanced Configuration

### 1. Multiple Environments

Create separate environment files:
```bash
.env                 # Default/development
.env.local          # Local overrides (gitignored)
.env.production     # Production values (for reference only)
.env.staging        # Staging environment
```

### 2. Environment Validation

```typescript
// src/utils/validateEnv.ts
const requiredEnvVars = ['MONGO_URI', 'NODE_ENV'];

export const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ All required environment variables are set');
};
```

### 3. Heroku Config Management

```bash
# Backup current config
heroku config -a campusconnect-app > heroku-config-backup.txt

# Copy config from one app to another
heroku config -a source-app | heroku config:set -a target-app

# Set config from file
heroku config:set $(cat .env | grep -v '^#' | xargs) -a campusconnect-app
```

## 📋 Environment Variables Checklist

Before deploying, ensure you have:

- [ ] **Local Development**
  - [ ] `.env` file created
  - [ ] All required variables set
  - [ ] `.env` added to `.gitignore`
  - [ ] Application loads variables correctly

- [ ] **Heroku Production**
  - [ ] `NODE_ENV=production` set
  - [ ] `MONGO_URI` with correct credentials
  - [ ] `API_BASE_URL` pointing to Heroku app
  - [ ] All variables showing in `heroku config`
  - [ ] App restarts after setting variables

- [ ] **Security**
  - [ ] Strong, unique secrets for production
  - [ ] No sensitive data in code repository
  - [ ] Database credentials are correct
  - [ ] IP whitelist includes Heroku IPs in MongoDB Atlas

## 🆘 Getting Help

If you encounter issues:

1. **Check Heroku logs**: `heroku logs --tail -a campusconnect-app`
2. **Verify MongoDB connection**: Test connection string in MongoDB Compass
3. **Check variable values**: Use `heroku config` to ensure variables are set
4. **Environment format**: Ensure no extra spaces or special characters

---

Your environment variables are now properly configured for both local development and Heroku production! 🎉