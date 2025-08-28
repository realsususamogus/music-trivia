// Main page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    loadHighScores();
});

async function loadHighScores() {
    try {
        const response = await fetch('/api/highscores');
        const highScores = await response.json();
        displayHighScores(highScores);
    } catch (error) {
        console.error('Error loading high scores:', error);
        document.getElementById('highScoresList').innerHTML = '<p>Error loading scores</p>';
    }
}

function displayHighScores(scores) {
    const container = document.getElementById('highScoresList');
    
    if (scores.length === 0) {
        container.innerHTML = '<p>No high scores yet! Be the first to play.</p>';
        return;
    }
    
    const scoresHTML = scores.map((score, index) => `
        <div class="score-entry">
            <span class="rank">#${index + 1}</span>
            <span class="player-name">${score.playerName}</span>
            <div>
                <span class="score-value">${score.score}</span>
                <small class="mode">(${score.mode})</small>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = scoresHTML;
}