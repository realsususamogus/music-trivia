// Multiplayer game JavaScript
let socket;
let gameState = {
    roomId: '',
    playerName: '',
    isReady: false,
    currentQuestion: null,
    timer: null,
    timerInterval: null
};

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function joinRoom() {
    const playerName = document.getElementById('playerName').value.trim();
    const roomCode = document.getElementById('roomCode').value.trim();
    
    if (!playerName) {
        alert('Please enter your name!');
        return;
    }
    
    gameState.playerName = playerName;
    gameState.roomId = roomCode || generateRoomId();
    
    connectToServer();
}

function createRandomRoom() {
    const playerName = document.getElementById('playerName').value.trim();
    
    if (!playerName) {
        alert('Please enter your name!');
        return;
    }
    
    gameState.playerName = playerName;
    gameState.roomId = generateRoomId();
    
    connectToServer();
}

function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function connectToServer() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
        socket.emit('join-room', {
            roomId: gameState.roomId,
            playerName: gameState.playerName
        });
    });
    
    socket.on('player-joined', (data) => {
        showScreen('waitingRoom');
        document.getElementById('currentRoomId').textContent = gameState.roomId;
        document.getElementById('roomId').textContent = gameState.roomId;
        updatePlayersList(data.players);
        updateGameStatus(data.gameState);
    });
    
    socket.on('player-ready-update', (data) => {
        updatePlayersList(data.players);
        
        if (data.allReady) {
            document.getElementById('waitingMessage').textContent = 'All players ready! Game starting soon...';
        } else {
            document.getElementById('waitingMessage').textContent = 'Waiting for players to be ready...';
        }
    });
    
    socket.on('game-started', (data) => {
        showScreen('multiplayerGame');
        updateGameStatus('Playing');
        document.getElementById('waitingMessage').textContent = `Game started! ${data.totalQuestions} questions`;
    });
    
    socket.on('new-question', (data) => {
        displayMultiplayerQuestion(data);
    });
    
    socket.on('answer-result', (data) => {
        showAnswerResult(data);
    });
    
    socket.on('score-update', (data) => {
        updateLiveScores(data.players);
    });
    
    socket.on('game-finished', (data) => {
        showGameResults(data.players);
    });
    
    socket.on('player-left', (data) => {
        updatePlayersList(data.players);
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        alert('Connection lost. Please refresh the page.');
    });
}

function updatePlayersList(players) {
    const playersListEl = document.getElementById('playersList');
    document.getElementById('playerCount').textContent = players.length;
    
    const playersHTML = players.map(player => `
        <div class="player-item">
            <span class="player-name">${player.name}</span>
            <span class="player-status ${player.ready ? 'ready' : 'waiting'}">
                ${player.ready ? '✓ Ready' : '⏳ Waiting'}
            </span>
        </div>
    `).join('');
    
    playersListEl.innerHTML = playersHTML;
}

function updateGameStatus(status) {
    document.getElementById('gameStatus').textContent = status;
}

function toggleReady() {
    gameState.isReady = !gameState.isReady;
    
    const readyButton = document.getElementById('readyButton');
    if (gameState.isReady) {
        readyButton.textContent = 'Cancel Ready';
        readyButton.className = 'btn btn-secondary';
    } else {
        readyButton.textContent = 'Ready Up!';
        readyButton.className = 'btn btn-warning';
    }
    
    socket.emit('player-ready', {
        roomId: gameState.roomId
    });
}

function displayMultiplayerQuestion(data) {
    const { question, questionNumber, totalQuestions, timeLimit } = data;
    
    document.getElementById('questionText').textContent = question.question;
    
    // Update progress bar
    const progress = (questionNumber / totalQuestions) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    
    // Clear previous options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    // Create option buttons
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option';
        button.textContent = option;
        button.onclick = () => submitMultiplayerAnswer(index);
        optionsContainer.appendChild(button);
    });
    
    startMultiplayerTimer(timeLimit);
}

function startMultiplayerTimer(timeLimit) {
    const timerFill = document.getElementById('timerFill');
    
    gameState.timer = timeLimit;
    timerFill.style.width = '100%';
    
    gameState.timerInterval = setInterval(() => {
        gameState.timer--;
        
        const percentage = (gameState.timer / timeLimit) * 100;
        timerFill.style.width = `${percentage}%`;
        
        if (gameState.timer <= 0) {
            clearInterval(gameState.timerInterval);
            disableOptions();
        }
    }, 1000);
}

function submitMultiplayerAnswer(answerIndex) {
    clearInterval(gameState.timerInterval);
    disableOptions();
    
    // Highlight selected answer
    const options = document.querySelectorAll('.option');
    options[answerIndex].classList.add('selected');
    
    socket.emit('submit-answer', {
        roomId: gameState.roomId,
        answerIndex: answerIndex
    });
}

function disableOptions() {
    document.querySelectorAll('.option').forEach(option => {
        option.style.pointerEvents = 'none';
    });
}

function showAnswerResult(data) {
    const options = document.querySelectorAll('.option');
    
    // Find correct answer option
    options.forEach((option, index) => {
        if (option.textContent === data.correctAnswer) {
            option.classList.add('correct');
        }
    });
    
    // Show feedback message (could add a toast notification here)
    if (data.correct) {
        console.log('Correct answer!');
    } else {
        console.log('Incorrect answer. Correct: ' + data.correctAnswer);
    }
}

function updateLiveScores(players) {
    const liveScoresEl = document.getElementById('liveScores');
    
    // Sort players by score
    const sortedPlayers = players.sort((a, b) => b.score - a.score);
    
    const scoresHTML = sortedPlayers.map((player, index) => `
        <div class="live-score-item">
            <span>${player.name}</span>
            <span class="score-value">${player.score}</span>
        </div>
    `).join('');
    
    liveScoresEl.innerHTML = scoresHTML;
}

function showGameResults(players) {
    showScreen('gameResults');
    
    const finalRankingsEl = document.getElementById('finalRankings');
    
    const rankingsHTML = players.map((player, index) => `
        <div class="ranking-item">
            <span class="ranking-position">#${index + 1}</span>
            <span class="ranking-name">${player.name}</span>
            <span class="ranking-score">${player.score}</span>
        </div>
    `).join('');
    
    finalRankingsEl.innerHTML = rankingsHTML;
}

function backToLobby() {
    // Reset ready state
    gameState.isReady = false;
    const readyButton = document.getElementById('readyButton');
    readyButton.textContent = 'Ready Up!';
    readyButton.className = 'btn btn-warning';
    
    showScreen('waitingRoom');
}

// Initialize the multiplayer screen
document.addEventListener('DOMContentLoaded', function() {
    showScreen('joinRoom');
});