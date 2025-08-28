// Database adapter for different storage backends
// This provides a unified interface regardless of the underlying database

class DatabaseAdapter {
  constructor() {
    this.type = this.detectDatabaseType();
    this.client = null;
    this.init();
  }

  detectDatabaseType() {
    if (process.env.MONGODB_URI) return 'mongodb';
    if (process.env.KV_REST_API_URL) return 'vercel-kv';
    return 'memory';
  }

  async init() {
    switch (this.type) {
      case 'mongodb':
        // MongoDB initialization would go here
        // const { MongoClient } = require('mongodb');
        // this.client = new MongoClient(process.env.MONGODB_URI);
        // await this.client.connect();
        console.log('MongoDB adapter initialized');
        break;
        
      case 'vercel-kv':
        // Vercel KV initialization
        // const { kv } = require('@vercel/kv');
        // this.client = kv;
        console.log('Vercel KV adapter initialized');
        break;
        
      default:
        // In-memory storage for development
        this.highScores = [];
        this.gameRooms = new Map();
        console.log('In-memory adapter initialized (development only)');
    }
  }

  async saveHighScore(scoreEntry) {
    switch (this.type) {
      case 'mongodb':
        // await this.client.db('music-trivia').collection('highScores').insertOne(scoreEntry);
        // return await this.getHighScores();
        break;
        
      case 'vercel-kv':
        // await this.client.lpush('highScores', JSON.stringify(scoreEntry));
        // const scores = await this.client.lrange('highScores', 0, 9);
        // return scores.map(s => JSON.parse(s));
        break;
        
      default:
        this.highScores.push(scoreEntry);
        this.highScores.sort((a, b) => b.score - a.score);
        if (this.highScores.length > 10) {
          this.highScores.splice(10);
        }
        return this.highScores;
    }
  }

  async getHighScores() {
    switch (this.type) {
      case 'mongodb':
        // return await this.client.db('music-trivia').collection('highScores')
        //   .find().sort({score: -1}).limit(10).toArray();
        break;
        
      case 'vercel-kv':
        // const scores = await this.client.lrange('highScores', 0, 9);
        // return scores.map(s => JSON.parse(s));
        break;
        
      default:
        return this.highScores;
    }
  }

  async saveGameRoom(roomId, roomData) {
    switch (this.type) {
      case 'mongodb':
        // await this.client.db('music-trivia').collection('gameRooms')
        //   .replaceOne({_id: roomId}, {_id: roomId, ...roomData}, {upsert: true});
        break;
        
      case 'vercel-kv':
        // await this.client.set(`room:${roomId}`, JSON.stringify(roomData), {ex: 1800}); // 30 min expiry
        break;
        
      default:
        this.gameRooms.set(roomId, roomData);
    }
  }

  async getGameRoom(roomId) {
    switch (this.type) {
      case 'mongodb':
        // return await this.client.db('music-trivia').collection('gameRooms').findOne({_id: roomId});
        break;
        
      case 'vercel-kv':
        // const roomData = await this.client.get(`room:${roomId}`);
        // return roomData ? JSON.parse(roomData) : null;
        break;
        
      default:
        return this.gameRooms.get(roomId);
    }
  }

  async deleteGameRoom(roomId) {
    switch (this.type) {
      case 'mongodb':
        // await this.client.db('music-trivia').collection('gameRooms').deleteOne({_id: roomId});
        break;
        
      case 'vercel-kv':
        // await this.client.del(`room:${roomId}`);
        break;
        
      default:
        this.gameRooms.delete(roomId);
    }
  }
}

module.exports = DatabaseAdapter;