// Single player game JavaScript
let gameState = {
    questions: [],
    currentQuestion: 0,
    score: 0,
    mode: 'normal',
    playerName: '',
    timeLimit: 15,
    timer: null,
    timerInterval: null
};

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function startGame(mode) {
    const playerNameInput = document.getElementById('playerName');
    const playerName = playerNameInput.value.trim();
    
    if (!playerName) {
        alert('Please enter your name!');
        return;
    }
    
    gameState.mode = mode;
    gameState.playerName = playerName;
    gameState.timeLimit = mode === 'timed' ? 30 : 15;
    
    loadQuestions();
}

async function loadQuestions() {
    try {
        const response = await fetch('/api/questions');
        const questions = await response.json();
        gameState.questions = questions;
        gameState.currentQuestion = 0;
        gameState.score = 0;
        
        showScreen('gamePlay');
        displayQuestion();
        updateGameInfo();
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Error loading questions. Please try again.');
    }
}

function displayQuestion() {
    const question = gameState.questions[gameState.currentQuestion];
    const questionText = document.getElementById('questionText');
    const optionsContainer = document.getElementById('optionsContainer');
    const progressFill = document.getElementById('progressFill');
    
    questionText.textContent = question.question;
    
    // Update progress bar
    const progress = ((gameState.currentQuestion + 1) / gameState.questions.length) * 100;
    progressFill.style.width = `${progress}%`;
    
    // Clear previous options
    optionsContainer.innerHTML = '';
    
    // Create option buttons
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option';
        button.textContent = option;
        button.onclick = () => selectAnswer(index);
        optionsContainer.appendChild(button);
    });
    
    startTimer();
}

function selectAnswer(selectedIndex) {
    clearInterval(gameState.timerInterval);
    
    const question = gameState.questions[gameState.currentQuestion];
    const options = document.querySelectorAll('.option');
    const isCorrect = selectedIndex === question.correct;
    
    // Disable all options
    options.forEach(option => {
        option.style.pointerEvents = 'none';
    });
    
    // Show correct answer
    options[question.correct].classList.add('correct');
    
    // Show selected answer if incorrect
    if (!isCorrect) {
        options[selectedIndex].classList.add('incorrect');
    } else {
        gameState.score += 10; // 10 points per correct answer
        updateGameInfo();
    }
    
    // Move to next question after 2 seconds
    setTimeout(() => {
        gameState.currentQuestion++;
        
        if (gameState.currentQuestion < gameState.questions.length) {
            displayQuestion();
        } else {
            endGame();
        }
    }, 2000);
}

function startTimer() {
    const timerFill = document.getElementById('timerFill');
    const timerDisplay = document.getElementById('timer');
    
    gameState.timer = gameState.timeLimit;
    timerDisplay.textContent = gameState.timer;
    timerFill.style.width = '100%';
    
    gameState.timerInterval = setInterval(() => {
        gameState.timer--;
        timerDisplay.textContent = gameState.timer;
        
        const percentage = (gameState.timer / gameState.timeLimit) * 100;
        timerFill.style.width = `${percentage}%`;
        
        if (gameState.timer <= 0) {
            selectAnswer(-1); // Time's up, no correct answer
        }
    }, 1000);
}

function updateGameInfo() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('questionNumber').textContent = gameState.currentQuestion + 1;
    document.getElementById('totalQuestions').textContent = gameState.questions.length;
}

async function endGame() {
    showScreen('gameEnd');
    document.getElementById('finalScore').textContent = gameState.score;
    
    // Submit high score
    try {
        const response = await fetch('/api/highscore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                playerName: gameState.playerName,
                score: gameState.score,
                mode: gameState.mode
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const messageEl = document.getElementById('highScoreMessage');
            if (result.rank <= 10) {
                messageEl.textContent = `🎉 New high score! You ranked #${result.rank}!`;
                messageEl.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error submitting high score:', error);
    }
}

function restartGame() {
    gameState = {
        questions: [],
        currentQuestion: 0,
        score: 0,
        mode: 'normal',
        playerName: '',
        timeLimit: 15,
        timer: null,
        timerInterval: null
    };
    
    document.getElementById('playerName').value = '';
    showScreen('gameStart');
}

// Initialize the game
document.addEventListener('DOMContentLoaded', function() {
    showScreen('gameStart');
});