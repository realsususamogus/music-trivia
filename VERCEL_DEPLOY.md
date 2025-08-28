# Vercel Deployment Guide

This document provides instructions for deploying the Music Trivia Game to Vercel and configuring database options.

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/realsususamogus/music-trivia)

## Manual Deployment Steps

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

## 📊 Database Requirements & Options

### Current Implementation
- **In-Memory Storage**: High scores and game rooms are stored in memory
- **Limitation**: Data is lost when the server restarts (not suitable for production)

### Database Options for Production

#### Option 1: Vercel KV (Recommended)
Redis-compatible key-value store that integrates seamlessly with Vercel.

**Setup:**
1. Go to your Vercel dashboard
2. Select your project → Storage → Create Database → KV
3. Add environment variables to your Vercel project:
   ```
   KV_REST_API_URL=your_kv_url
   KV_REST_API_TOKEN=your_kv_token
   ```

**Required changes:**
- Install `@vercel/kv`: `npm install @vercel/kv`
- Update high score storage to use KV
- Update multiplayer game rooms to use Redis for state

#### Option 2: MongoDB Atlas
Free cloud MongoDB database with generous free tier.

**Setup:**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster and get connection string
3. Add to environment variables:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/music-trivia
   ```

**Required changes:**
- Install MongoDB driver: `npm install mongodb`
- Create schemas for high scores and game sessions
- Update storage layer to use MongoDB

#### Option 3: PlanetScale (MySQL)
Serverless MySQL database with branching capabilities.

**Setup:**
1. Create account at [PlanetScale](https://planetscale.com/)
2. Create database and get connection string
3. Add environment variables:
   ```
   DATABASE_URL=mysql://username:password@host/database?sslaccept=strict
   ```

**Required changes:**
- Install MySQL driver: `npm install mysql2`
- Create SQL tables for high scores and game state
- Update queries to use SQL

## ⚠️ Important Considerations

### Socket.io Limitations on Vercel
Vercel's serverless functions have limitations with persistent WebSocket connections:

1. **Connection Issues**: Socket.io may not work reliably in Vercel's serverless environment
2. **Alternative Solutions**:
   - Use Vercel's Edge Runtime for better WebSocket support
   - Consider using Pusher or Ably for real-time features
   - Use polling instead of WebSockets for multiplayer updates

### Recommended Architecture for Vercel

```
Frontend (Static) → Vercel Functions (API) → External Database
                 ↘ Pusher/Ably (Real-time) ↗
```

## 🔧 Environment Variables

Add these to your Vercel project settings:

```bash
# Required for production
NODE_ENV=production

# Database (choose one)
MONGODB_URI=your_mongodb_connection_string
# OR
KV_REST_API_URL=your_vercel_kv_url
KV_REST_API_TOKEN=your_vercel_kv_token

# Optional: Spotify API for dynamic questions
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Optional: Real-time service
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster
```

## 📝 Next Steps

1. Choose a database option based on your needs
2. Update the backend code to use persistent storage
3. Consider replacing Socket.io with a Vercel-compatible real-time solution
4. Test the deployment thoroughly

The current implementation works great for local development but requires these changes for production deployment on Vercel.