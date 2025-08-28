# 🎵 Music Trivia Game 🎵

A web-based music trivia game featuring single-player and multiplayer modes with real-time gameplay.

## Features

### Single Player Mode
- **Normal Mode**: Answer music trivia questions at your own pace (15 seconds per question)
- **Timed Mode**: Challenge yourself with extended time limits (30 seconds per question)
- **High Score System**: Track your best performances locally
- **Question Types**: Artist identification, song recognition, album knowledge, and lyrics

### Multiplayer Mode
- **Real-time Multiplayer**: Play with friends using Socket.io
- **Room-based System**: Create or join game rooms with unique codes
- **Live Score Tracking**: See scores update in real-time during gameplay
- **Synchronized Questions**: All players receive questions simultaneously
- **Final Rankings**: View complete results at game end

## Technology Stack

- **Backend**: Node.js, Express.js, Socket.io
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Music Data**: Spotify Web API integration (with fallback questions)
- **Real-time Communication**: WebSocket connections via Socket.io

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/realsususamogus/music-trivia.git
   cd music-trivia
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your Spotify API credentials (optional)
   ```

4. Start the server:
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Spotify API Setup (Optional)

The game includes fallback questions and will work without Spotify API. For enhanced question variety:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Create a new app
3. Copy the Client ID and Client Secret
4. Add them to your `.env` file

## Game Modes

### Single Player
1. Choose between Normal or Timed mode
2. Enter your player name
3. Answer questions within the time limit
4. Submit high scores to the leaderboard

### Multiplayer
1. Enter your player name
2. Create a new room or join with a room code
3. Wait for other players and ready up
4. Answer questions simultaneously
5. View final rankings

## Project Structure

```
music-trivia/
├── server/
│   └── app.js              # Main server file with Express and Socket.io
├── public/
│   ├── index.html          # Main menu
│   ├── game.html          # Single player game
│   ├── multiplayer.html   # Multiplayer game
│   ├── css/
│   │   └── style.css      # All styles
│   └── js/
│       ├── main.js        # Main menu functionality
│       ├── game.js        # Single player game logic
│       └── multiplayer.js # Multiplayer game logic
├── package.json
└── README.md
```

## API Endpoints

- `GET /` - Main menu
- `GET /game` - Single player game
- `GET /multiplayer` - Multiplayer game
- `GET /api/questions` - Get trivia questions
- `POST /api/highscore` - Submit high score
- `GET /api/highscores` - Get high scores leaderboard

## Socket.io Events

### Client to Server
- `join-room` - Join a multiplayer room
- `player-ready` - Mark player as ready
- `submit-answer` - Submit answer for current question

### Server to Client
- `player-joined` - Player joined the room
- `player-ready-update` - Player ready status changed
- `game-started` - Game has begun
- `new-question` - New question available
- `answer-result` - Result of submitted answer
- `score-update` - Live score updates
- `game-finished` - Game completed with final results

## Development

The game is built with modern web technologies and follows best practices:

- Responsive design for mobile and desktop
- Real-time multiplayer using WebSockets
- Clean separation of client and server code
- Fallback systems for reliability
- Progressive enhancement

## 🚀 Deployment

### Vercel Deployment
For production deployment on Vercel with proper database support, see the [Vercel Deployment Guide](./VERCEL_DEPLOY.md).

**Quick Deploy:**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/realsususamogus/music-trivia)

**Database Requirements:**
- **Development**: No database required (uses in-memory storage)
- **Production**: Requires external database for persistent high scores and multiplayer state
- **Recommended**: Vercel KV (Redis) or MongoDB Atlas

### Local Development
The current implementation works great for local development using in-memory storage. For production, you'll need to configure a database as outlined in the Vercel deployment guide.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - Feel free to use this project for learning and development!
