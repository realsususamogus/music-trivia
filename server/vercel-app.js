// Vercel-compatible version of the music trivia game
// This version removes Socket.io dependencies and uses polling for real-time features

const express = require('express');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());

// Environment detection
const isVercel = process.env.VERCEL === '1';
const PORT = process.env.PORT || 3000;

// External database connection (placeholder - implement based on chosen database)
let db;
if (process.env.MONGODB_URI) {
  // MongoDB implementation would go here
  console.log('MongoDB connection configured');
} else if (process.env.KV_REST_API_URL) {
  // Vercel KV implementation would go here  
  console.log('Vercel KV configured');
} else {
  // Fallback to in-memory (for local development only)
  console.log('Using in-memory storage (not suitable for production)');
}

// In-memory storage (fallback for local development)
const gameRooms = new Map();
const highScores = [];

// Sample trivia questions
const fallbackQuestions = [
  {
    id: 1,
    question: "Which artist released the album 'Thriller'?",
    options: ["Michael Jackson", "Prince", "Madonna", "Whitney Houston"],
    correct: 0,
    type: "artist"
  },
  {
    id: 2,
    question: "What year was 'Bohemian Rhapsody' by Queen released?",
    options: ["1974", "1975", "1976", "1977"],
    correct: 1,
    type: "year"
  },
  {
    id: 3,
    question: "Which song contains the lyrics 'Is this the real life? Is this just fantasy?'",
    options: ["We Will Rock You", "Another One Bites the Dust", "Bohemian Rhapsody", "We Are the Champions"],
    correct: 2,
    type: "lyrics"
  },
  {
    id: 4,
    question: "Which band performed 'Stairway to Heaven'?",
    options: ["The Beatles", "Led Zeppelin", "Pink Floyd", "The Rolling Stones"],
    correct: 1,
    type: "artist"
  },
  {
    id: 5,
    question: "What genre is most associated with Bob Marley?",
    options: ["Jazz", "Blues", "Reggae", "Rock"],
    correct: 2,
    type: "genre"
  },
  {
    id: 6,
    question: "Which album features the song 'Hotel California'?",
    options: ["The Long Run", "Hotel California", "One of These Nights", "Eagles Greatest Hits"],
    correct: 1,
    type: "album"
  },
  {
    id: 7,
    question: "Complete the lyric: 'Hello, is it me you're looking ___?'",
    options: ["at", "for", "after", "around"],
    correct: 1,
    type: "lyrics"
  },
  {
    id: 8,
    question: "Which artist is known as the 'King of Pop'?",
    options: ["Elvis Presley", "Michael Jackson", "Prince", "David Bowie"],
    correct: 1,
    type: "artist"
  },
  {
    id: 9,
    question: "What instrument is Jimi Hendrix most famous for playing?",
    options: ["Piano", "Drums", "Bass", "Guitar"],
    correct: 3,
    type: "instrument"
  },
  {
    id: 10,
    question: "Which city is often called the birthplace of jazz?",
    options: ["Chicago", "New York", "New Orleans", "Memphis"],
    correct: 2,
    type: "history"
  }
];

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'game.html'));
});

app.get('/multiplayer', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'multiplayer.html'));
});

// API Routes
app.get('/api/questions', (req, res) => {
  const shuffledQuestions = fallbackQuestions.sort(() => 0.5 - Math.random()).slice(0, 5);
  res.json(shuffledQuestions);
});

// High Scores API
app.post('/api/highscore', async (req, res) => {
  const { playerName, score, mode } = req.body;
  
  const scoreEntry = {
    playerName,
    score,
    mode,
    timestamp: new Date().toISOString()
  };
  
  try {
    if (process.env.MONGODB_URI) {
      // MongoDB implementation
      // await db.collection('highScores').insertOne(scoreEntry);
      // const topScores = await db.collection('highScores').find().sort({score: -1}).limit(10).toArray();
    } else if (process.env.KV_REST_API_URL) {
      // Vercel KV implementation
      // const { kv } = require('@vercel/kv');
      // await kv.lpush('highScores', JSON.stringify(scoreEntry));
      // const scores = await kv.lrange('highScores', 0, 9);
    } else {
      // Fallback to in-memory
      highScores.push(scoreEntry);
      highScores.sort((a, b) => b.score - a.score);
      if (highScores.length > 10) {
        highScores.splice(10);
      }
    }
    
    const rank = highScores.findIndex(s => s === scoreEntry) + 1;
    res.json({ success: true, rank });
  } catch (error) {
    console.error('Error saving high score:', error);
    res.status(500).json({ error: 'Failed to save high score' });
  }
});

app.get('/api/highscores', async (req, res) => {
  try {
    let scores = [];
    
    if (process.env.MONGODB_URI) {
      // MongoDB implementation
      // scores = await db.collection('highScores').find().sort({score: -1}).limit(10).toArray();
    } else if (process.env.KV_REST_API_URL) {
      // Vercel KV implementation  
      // const { kv } = require('@vercel/kv');
      // const scoreStrings = await kv.lrange('highScores', 0, 9);
      // scores = scoreStrings.map(s => JSON.parse(s));
    } else {
      // Fallback to in-memory
      scores = highScores;
    }
    
    res.json(scores);
  } catch (error) {
    console.error('Error fetching high scores:', error);
    res.status(500).json({ error: 'Failed to fetch high scores' });
  }
});

// Multiplayer API endpoints (polling-based for Vercel compatibility)
app.post('/api/rooms', (req, res) => {
  const { playerName } = req.body;
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const room = {
    id: roomId,
    players: [{
      id: Math.random().toString(36).substring(2, 15),
      name: playerName,
      score: 0,
      ready: false
    }],
    gameState: 'waiting',
    currentQuestion: 0,
    questions: [],
    createdAt: Date.now()
  };
  
  gameRooms.set(roomId, room);
  
  res.json({ 
    success: true, 
    roomId, 
    playerId: room.players[0].id,
    room 
  });
});

app.post('/api/rooms/:roomId/join', (req, res) => {
  const { roomId } = req.params;
  const { playerName } = req.body;
  
  const room = gameRooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  const playerId = Math.random().toString(36).substring(2, 15);
  const player = {
    id: playerId,
    name: playerName,
    score: 0,
    ready: false
  };
  
  room.players.push(player);
  
  res.json({ 
    success: true, 
    playerId,
    room 
  });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = gameRooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json(room);
});

app.post('/api/rooms/:roomId/ready', (req, res) => {
  const { roomId } = req.params;
  const { playerId } = req.body;
  
  const room = gameRooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.ready = true;
    
    const allReady = room.players.length >= 2 && room.players.every(p => p.ready);
    if (allReady && room.gameState === 'waiting') {
      room.gameState = 'playing';
      room.questions = fallbackQuestions.sort(() => 0.5 - Math.random()).slice(0, 5);
      room.currentQuestion = 0;
      room.questionStartTime = Date.now();
    }
  }
  
  res.json({ success: true, room });
});

app.post('/api/rooms/:roomId/answer', (req, res) => {
  const { roomId } = req.params;
  const { playerId, answerIndex } = req.body;
  
  const room = gameRooms.get(roomId);
  if (!room || room.gameState !== 'playing') {
    return res.status(400).json({ error: 'Game not active' });
  }
  
  const player = room.players.find(p => p.id === playerId);
  const currentQuestion = room.questions[room.currentQuestion];
  
  if (player && currentQuestion) {
    const isCorrect = answerIndex === currentQuestion.correct;
    if (isCorrect) {
      player.score += 10;
    }
    
    res.json({
      correct: isCorrect,
      correctAnswer: currentQuestion.options[currentQuestion.correct],
      room
    });
  } else {
    res.status(400).json({ error: 'Invalid player or question' });
  }
});

// Clean up old rooms (prevent memory leaks)
if (!isVercel) {
  setInterval(() => {
    const now = Date.now();
    const ROOM_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    
    for (const [roomId, room] of gameRooms.entries()) {
      if (now - room.createdAt > ROOM_TIMEOUT) {
        gameRooms.delete(roomId);
        console.log(`Cleaned up expired room: ${roomId}`);
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
}

// Export for Vercel
module.exports = app;

// Start server for local development
if (!isVercel && require.main === module) {
  const server = require('http').createServer(app);
  
  server.listen(PORT, () => {
    console.log(`Music Trivia Game server running on port ${PORT}`);
    console.log('Note: This version uses polling instead of Socket.io for Vercel compatibility');
  });
}