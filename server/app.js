const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());

// In-memory storage for game data
const gameRooms = new Map();
const highScores = [];

// Spotify API credentials (will need to be set in .env file)
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Sample trivia questions (fallback if Spotify API is not available)
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
  // For now, return fallback questions
  // TODO: Implement Spotify API integration
  const shuffledQuestions = fallbackQuestions.sort(() => 0.5 - Math.random()).slice(0, 5);
  res.json(shuffledQuestions);
});

app.post('/api/highscore', (req, res) => {
  const { playerName, score, mode } = req.body;
  
  const scoreEntry = {
    playerName,
    score,
    mode,
    timestamp: new Date().toISOString()
  };
  
  highScores.push(scoreEntry);
  highScores.sort((a, b) => b.score - a.score);
  
  // Keep only top 10 scores
  if (highScores.length > 10) {
    highScores.splice(10);
  }
  
  res.json({ success: true, rank: highScores.findIndex(s => s === scoreEntry) + 1 });
});

app.get('/api/highscores', (req, res) => {
  res.json(highScores);
});

// Socket.io for multiplayer functionality
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (data) => {
    const { roomId, playerName } = data;
    
    if (!gameRooms.has(roomId)) {
      gameRooms.set(roomId, {
        players: [],
        gameState: 'waiting',
        currentQuestion: 0,
        questions: []
      });
    }
    
    const room = gameRooms.get(roomId);
    const player = {
      id: socket.id,
      name: playerName,
      score: 0,
      ready: false
    };
    
    room.players.push(player);
    socket.join(roomId);
    
    io.to(roomId).emit('player-joined', {
      players: room.players,
      gameState: room.gameState
    });
  });
  
  socket.on('player-ready', (data) => {
    const { roomId } = data;
    const room = gameRooms.get(roomId);
    
    if (room) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.ready = true;
        
        // Check if all players are ready
        const allReady = room.players.length >= 2 && room.players.every(p => p.ready);
        
        if (allReady && room.gameState === 'waiting') {
          startMultiplayerGame(roomId);
        }
        
        io.to(roomId).emit('player-ready-update', {
          players: room.players,
          allReady
        });
      }
    }
  });
  
  socket.on('submit-answer', (data) => {
    const { roomId, answerIndex } = data;
    const room = gameRooms.get(roomId);
    
    if (room && room.gameState === 'playing') {
      const player = room.players.find(p => p.id === socket.id);
      const currentQuestion = room.questions[room.currentQuestion];
      
      if (player && currentQuestion) {
        const isCorrect = answerIndex === currentQuestion.correct;
        if (isCorrect) {
          player.score += 10; // 10 points per correct answer
        }
        
        socket.emit('answer-result', {
          correct: isCorrect,
          correctAnswer: currentQuestion.options[currentQuestion.correct]
        });
        
        // Update scores for all players in room
        io.to(roomId).emit('score-update', {
          players: room.players
        });
      }
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove player from all rooms
    for (const [roomId, room] of gameRooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          gameRooms.delete(roomId);
        } else {
          io.to(roomId).emit('player-left', {
            players: room.players
          });
        }
        break;
      }
    }
  });
});

function startMultiplayerGame(roomId) {
  const room = gameRooms.get(roomId);
  if (!room) return;
  
  room.gameState = 'playing';
  room.currentQuestion = 0;
  room.questions = fallbackQuestions.sort(() => 0.5 - Math.random()).slice(0, 5);
  
  // Reset player scores
  room.players.forEach(player => {
    player.score = 0;
  });
  
  io.to(roomId).emit('game-started', {
    gameState: room.gameState,
    totalQuestions: room.questions.length
  });
  
  sendNextQuestion(roomId);
}

function sendNextQuestion(roomId) {
  const room = gameRooms.get(roomId);
  if (!room || room.currentQuestion >= room.questions.length) {
    // Game finished
    room.gameState = 'finished';
    io.to(roomId).emit('game-finished', {
      players: room.players.sort((a, b) => b.score - a.score)
    });
    return;
  }
  
  const question = room.questions[room.currentQuestion];
  
  io.to(roomId).emit('new-question', {
    question,
    questionNumber: room.currentQuestion + 1,
    totalQuestions: room.questions.length,
    timeLimit: 15 // 15 seconds per question
  });
  
  // Auto-advance to next question after time limit
  setTimeout(() => {
    room.currentQuestion++;
    sendNextQuestion(roomId);
  }, 16000); // 15 seconds + 1 second buffer
}

server.listen(PORT, () => {
  console.log(`Music Trivia Game server running on port ${PORT}`);
});