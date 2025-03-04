class WordleAI {
    constructor(wordList) {
        this.wordList = wordList;
        this.possibleWords = [...wordList];
        this.letterFrequency = this.calculateLetterFrequency();
        this.previousGuesses = [];
        this.feedback = [];
    }

    // Calculate letter frequency in the word list
    calculateLetterFrequency() {
        const freq = {};
        for (let word of this.wordList) {
            for (let letter of word) {
                freq[letter] = (freq[letter] || 0) + 1;
            }
        }
        return freq;
    }

    // Calculate word score based on letter frequency and position
    calculateWordScore(word) {
        let score = 0;
        const usedLetters = new Set();
        
        for (let i = 0; i < word.length; i++) {
            const letter = word[i];
            // If letter hasn't been used in this word, add its frequency score
            if (!usedLetters.has(letter)) {
                score += this.letterFrequency[letter];
                usedLetters.add(letter);
            }
        }
        
        return score;
    }

    // Get the next best guess based on current information
    getNextGuess() {
        if (this.previousGuesses.length === 0) {
            // First guess: use the word with highest letter frequency score
            const firstGuess = this.wordList
                .map(word => ({word, score: this.calculateWordScore(word)}))
                .sort((a, b) => b.score - a.score)[0].word;
            return firstGuess;
        }

        // Filter possible words based on previous feedback
        this.updatePossibleWords();

        // If only one word remains, that must be the answer
        if (this.possibleWords.length === 1) {
            return this.possibleWords[0];
        }

        // Choose the word that will provide the most information
        return this.getBestInformationGain();
    }

    // Update possible words based on feedback
    updatePossibleWords() {
        for (let i = 0; i < this.previousGuesses.length; i++) {
            const guess = this.previousGuesses[i];
            const currentFeedback = this.feedback[i];
            
            this.possibleWords = this.possibleWords.filter(word => {
                return this.isWordCompatible(word, guess, currentFeedback);
            });
        }
    }

    // Check if a word is compatible with the feedback from a previous guess
    isWordCompatible(word, guess, feedback) {
        const letterCount = {};
        
        // Count letters in the candidate word
        for (let letter of word) {
            letterCount[letter] = (letterCount[letter] || 0) + 1;
        }

        // Check each position
        for (let i = 0; i < 5; i++) {
            const guessLetter = guess[i];
            const feedbackType = feedback[i];

            if (feedbackType === 'correct') {
                if (word[i] !== guessLetter) return false;
                letterCount[guessLetter]--;
            } else if (feedbackType === 'present') {
                if (word[i] === guessLetter) return false;
                if (!letterCount[guessLetter] || letterCount[guessLetter] <= 0) return false;
                letterCount[guessLetter]--;
            } else if (feedbackType === 'absent') {
                if (letterCount[guessLetter] > 0) return false;
            }
        }

        return true;
    }

    // Get the word that will provide the most information gain
    getBestInformationGain() {
        let bestWord = '';
        let maxScore = -Infinity;

        for (let word of this.wordList) {
            let score = this.calculateInformationGain(word);
            if (score > maxScore) {
                maxScore = score;
                bestWord = word;
            }
        }

        return bestWord;
    }

    // Calculate how much information we might gain from a guess
    calculateInformationGain(word) {
        const patterns = new Map();
        
        // For each possible answer, calculate what pattern we'd get
        for (let possibleAnswer of this.possibleWords) {
            const pattern = this.getPattern(word, possibleAnswer);
            const count = patterns.get(pattern) || 0;
            patterns.set(pattern, count + 1);
        }

        // Calculate entropy (information gain)
        let entropy = 0;
        const totalWords = this.possibleWords.length;
        
        for (let count of patterns.values()) {
            const probability = count / totalWords;
            entropy -= probability * Math.log2(probability);
        }

        return entropy;
    }

    // Get the pattern of feedback that would result from a guess
    getPattern(guess, answer) {
        const result = ['absent', 'absent', 'absent', 'absent', 'absent'];
        const letterCount = {};
        
        // Count letters in answer
        for (let letter of answer) {
            letterCount[letter] = (letterCount[letter] || 0) + 1;
        }

        // First pass: mark correct letters
        for (let i = 0; i < 5; i++) {
            if (guess[i] === answer[i]) {
                result[i] = 'correct';
                letterCount[guess[i]]--;
            }
        }

        // Second pass: mark present letters
        for (let i = 0; i < 5; i++) {
            if (result[i] !== 'correct' && letterCount[guess[i]] > 0) {
                result[i] = 'present';
                letterCount[guess[i]]--;
            }
        }

        return result.join('');
    }

    // Process feedback from the game
    submitFeedback(guess, feedback) {
        this.previousGuesses.push(guess);
        this.feedback.push(feedback);
    }

    // Reset the AI for a new game
    reset() {
        this.possibleWords = [...this.wordList];
        this.previousGuesses = [];
        this.feedback = [];
    }
}

// Initialize the AI
const wordleAI = new WordleAI(validWords);

// Add AI controls to the UI
function initializeAI() {
    const aiControls = document.createElement('div');
    aiControls.className = 'fixed top-4 right-4 bg-white p-4 rounded-lg shadow-md';
    aiControls.innerHTML = `
        <button id="aiGuessBtn" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mb-2 w-full">
            Get AI Suggestion
        </button>
        <button id="aiResetBtn" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 w-full">
            Reset AI
        </button>
    `;
    document.body.appendChild(aiControls);

    // Add event listeners
    document.getElementById('aiGuessBtn').addEventListener('click', () => {
        const suggestion = wordleAI.getNextGuess();
        showToast(`AI suggests: ${suggestion}`);
    });

    document.getElementById('aiResetBtn').addEventListener('click', () => {
        wordleAI.reset();
        showToast('AI reset complete');
    });
}

// Initialize AI when the page loads
window.addEventListener('load', initializeAI);

// Update the evaluateGuess function in app.js to work with the AI
const originalEvaluateGuess = window.evaluateGuess;
window.evaluateGuess = function(guess) {
    const feedback = [];
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
            feedback[index] = 'correct';
            letterCount[letter]--;
        }
    });

    // Second pass: mark present/absent letters
    rowTiles.forEach((tile, index) => {
        if (!feedback[index]) {
            const letter = tile.textContent;
            if (letterCount[letter] > 0) {
                feedback[index] = 'present';
                letterCount[letter]--;
            } else {
                feedback[index] = 'absent';
            }
        }
    });

    // Submit feedback to AI
    wordleAI.submitFeedback(guess, feedback);

    // Call original evaluation function
    originalEvaluateGuess(guess);
};
