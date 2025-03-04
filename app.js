// Game state
let currentRow = 0;
let currentTile = 0;
let gameOver = false;
let secretWord = secretWords[Math.floor(Math.random() * secretWords.length)];

// Initialize game board
const board = document.getElementById('board');
for (let i = 0; i < 6; i++) {
    const row = document.createElement('div');
    row.className = 'flex gap-1';
    for (let j = 0; j < 5; j++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        row.appendChild(tile);
    }
    board.appendChild(row);
}

// Get all tiles
const tiles = document.querySelectorAll('.tile');

// Initialize keyboard after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Handle physical keyboard input
    document.addEventListener('keydown', handleKeyPress);

    // Handle on-screen keyboard
    document.querySelectorAll('.key').forEach(key => {
        key.addEventListener('click', (e) => {
            e.preventDefault();
            const letter = key.getAttribute('data-key');
            console.log('Key clicked:', letter); // Debug log
            handleInput(letter);
        });
    });
});

// Debug function to log the current state
function logGameState() {
    console.log('Current Row:', currentRow);
    console.log('Current Tile:', currentTile);
    console.log('Game Over:', gameOver);
    console.log('Secret Word:', secretWord);
}

function handleKeyPress(e) {
    if (gameOver) return;
    
    if (e.key === 'Enter') {
        handleInput('ENTER');
    } else if (e.key === 'Backspace') {
        handleInput('BACKSPACE');
    } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleInput(e.key.toUpperCase());
    }
}

function handleInput(key) {
    if (gameOver) return;

    if (key === 'ENTER') {
        submitGuess();
    } else if (key === 'BACKSPACE') {
        deleteLetter();
    } else if (/^[A-Z]$/.test(key)) {
        addLetter(key);
    }
}

function addLetter(letter) {
    if (currentTile < 5) {
        const tile = tiles[currentRow * 5 + currentTile];
        tile.textContent = letter;
        tile.classList.add('filled');
        tile.classList.add('bounce');
        setTimeout(() => tile.classList.remove('bounce'), 100);
        currentTile++;
    }
}

function deleteLetter() {
    if (currentTile > 0) {
        currentTile--;
        const tile = tiles[currentRow * 5 + currentTile];
        tile.textContent = '';
        tile.classList.remove('filled');
    }
}

function submitGuess() {
    if (currentTile !== 5) {
        showToast('Not enough letters');
        shakeRow();
        return;
    }

    const guess = getCurrentGuess();
    if (!validWords.includes(guess)) {
        showToast('Not in word list');
        shakeRow();
        return;
    }

    evaluateGuess(guess);
    currentRow++;
    currentTile = 0;

    if (guess === secretWord) {
        gameOver = true;
        setTimeout(() => showGameOver(true), 1500);
    } else if (currentRow === 6) {
        gameOver = true;
        setTimeout(() => showGameOver(false), 1500);
    }
}

function getCurrentGuess() {
    let guess = '';
    const rowTiles = Array.from(tiles).slice(currentRow * 5, currentRow * 5 + 5);
    rowTiles.forEach(tile => {
        guess += tile.textContent;
    });
    return guess;
}

function evaluateGuess(guess) {
    const rowTiles = Array.from(tiles).slice(currentRow * 5, currentRow * 5 + 5);
    const letterCount = {};
    
    // Count letters in secret word
    for (let letter of secretWord) {
        letterCount[letter] = (letterCount[letter] || 0) + 1;
    }

    // First pass: mark correct letters
    rowTiles.forEach((tile, index) => {
        const letter = tile.textContent;
        if (letter === secretWord[index]) {
            updateTile(tile, 'correct');
            updateKey(letter, 'correct');
            letterCount[letter]--;
        }
    });

    // Second pass: mark present/absent letters
    rowTiles.forEach((tile, index) => {
        const letter = tile.textContent;
        if (letter !== secretWord[index]) {
            if (letterCount[letter] > 0) {
                updateTile(tile, 'present');
                updateKey(letter, 'present');
                letterCount[letter]--;
            } else {
                updateTile(tile, 'absent');
                updateKey(letter, 'absent');
            }
        }
    });
}

function updateTile(tile, status) {
    setTimeout(() => {
        tile.classList.add(status);
    }, tile.dataset.index * 100);
}

function updateKey(letter, status) {
    const key = document.querySelector(`[data-key="${letter}"]`);
    if (key) {
        const currentStatus = key.classList.contains('correct') ? 'correct' :
                            key.classList.contains('present') ? 'present' : null;
        
        if (!currentStatus || status === 'correct' ||
            (status === 'present' && currentStatus === 'absent')) {
            key.className = `key ${status}`;
        }
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

function shakeRow() {
    const rowTiles = Array.from(tiles).slice(currentRow * 5, currentRow * 5 + 5);
    rowTiles.forEach(tile => {
        tile.classList.add('shake');
        setTimeout(() => tile.classList.remove('shake'), 500);
    });
}

function showGameOver(won) {
    const modal = document.getElementById('gameOverModal');
    const title = document.getElementById('gameOverTitle');
    const message = document.getElementById('gameOverMessage');
    
    title.textContent = won ? 'Congratulations!' : 'Game Over';
    message.textContent = won ? 
        `You found the word in ${currentRow} ${currentRow === 1 ? 'try' : 'tries'}!` :
        `The word was ${secretWord}`;
    
    modal.classList.remove('hidden');
}

// Restart game
document.getElementById('restartButton').addEventListener('click', () => {
    location.reload();
});

// Initialize tile indices for animation delays
tiles.forEach((tile, index) => {
    tile.dataset.index = index % 5;
});
